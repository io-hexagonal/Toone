/**
 * Typed client for Toone Pro billing: prices, Stripe Checkout and Customer
 * Portal sessions, the account's entitlement, redeemable codes, the admin
 * code tools and the billing feature flags.
 *
 * Every call throws `BillingError` (see `./errors`); branch on
 * `billingFailure(caught).kind`. Signed-in calls go through `authedRequest`
 * from `lib/api.ts`. Responses are normalized here: unknown enum values become
 * "unknown" (never a crash), optional fields become null.
 */

import {
  ApiError,
  apiBase,
  apiErrorFrom,
  authedRequest,
  type CreatedInvitation,
  type InvitationPreview,
  type InvitationRecord,
} from "../api";
import {
  BillingError,
  asBillingError,
  billingProvider,
  enumValue,
  mapApiError,
  proSource,
  type BillingProvider,
  type ProSource,
} from "./errors";
import { allowedStripeUrl } from "./stripe-url";

export * from "./errors";
export { allowedStripeUrl, isAllowedStripeUrl, STRIPE_REDIRECT_HOSTS, type StripeRedirectKind } from "./stripe-url";

/* ---- shared value types */

export type ProPlanId = "pro_monthly" | "pro_yearly" | "pro_lifetime";
export type PlanInterval = "month" | "year" | "lifetime";
export type ProPlan = "free" | "pro" | "unknown";
export type ProStatus = "active" | "grace" | "unknown";
/** How the account manages a paid plan: Apple's subscriptions page or the Stripe Customer Portal. */
export type ProManage = "app_store" | "stripe_portal" | "unknown";
/** Where a Stripe page sends the buyer back to. */
export type BillingReturn = "web" | "app";

export const PRO_PLANS: readonly ProPlanId[] = ["pro_monthly", "pro_yearly", "pro_lifetime"];

const PLAN_INTERVAL: Readonly<Record<ProPlanId, PlanInterval>> = {
  pro_monthly: "month",
  pro_yearly: "year",
  pro_lifetime: "lifetime",
};

const PLAN_PARAMS: Readonly<Record<string, ProPlanId>> = {
  monthly: "pro_monthly",
  yearly: "pro_yearly",
  lifetime: "pro_lifetime",
};

export function isProPlanId(value: unknown): value is ProPlanId {
  return typeof value === "string" && (PRO_PLANS as readonly string[]).includes(value);
}

/** `?plan=` value (`monthly` | `yearly` | `lifetime`, or a full plan id) to a plan id; null otherwise. */
export function planFromParam(value: unknown): ProPlanId | null {
  if (typeof value !== "string") return null;
  if (isProPlanId(value)) return value;
  return Object.prototype.hasOwnProperty.call(PLAN_PARAMS, value) ? PLAN_PARAMS[value] : null;
}

/** The short `?plan=` form of a plan id. */
export function planParam(plan: ProPlanId): "monthly" | "yearly" | "lifetime" {
  return plan === "pro_monthly" ? "monthly" : plan === "pro_yearly" ? "yearly" : "lifetime";
}

/* ---- transport */

type Raw = Record<string, unknown>;

function record(value: unknown): Raw | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function jsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

/** Unauthenticated request with the API's `{data}` envelope and error shape. */
async function publicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body (proxy error page etc.)
  }
  if (!res.ok) throw apiErrorFrom(body, res.status);
  return record(body)?.data as T;
}

async function call<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw asBillingError(error);
  }
}

/**
 * Like `call`, but an `already_pro` refusal names the Pro that blocks the
 * request: the error body's own `source` and `billing_provider` first, and
 * only for a field the body leaves out, the account's current entitlement
 * (best effort; it reports the highest-ranking Pro, not the blocking one).
 */
async function callNamingPro<T>(token: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.code === "already_pro") {
      let source = proSource(error.fields.source);
      let provider = billingProvider(error.fields.billing_provider);
      if (source === null || provider === null) {
        const entitlement = await getEntitlement(token).catch(() => null);
        source ??= entitlement?.source ?? null;
        provider ??= entitlement?.billing_provider ?? null;
      }
      throw new BillingError(mapApiError(error, { source, provider }));
    }
    throw asBillingError(error);
  }
}

function refusedRedirect(kind: string): BillingError {
  return new BillingError({
    kind: "unknown",
    status: 0,
    code: "untrusted_redirect",
    message: `The ${kind} link from the server was not a Stripe page.`,
  });
}

/* ---- prices (public, cacheable) */

export type Price = {
  plan: ProPlanId;
  interval: PlanInterval;
  /** Minor units (cents) in `currency`. */
  amount: number;
  /** ISO 4217, lowercase as sent. */
  currency: string;
  /** Ready-to-show price string from the server; prefer it over formatting `amount`. */
  display_price: string;
  /** True when `display_price` includes VAT. */
  tax_inclusive: boolean;
};

export function normalizePrices(raw: unknown): Price[] {
  const list = Array.isArray(raw) ? raw : record(raw)?.prices;
  if (!Array.isArray(list)) return [];
  const prices: Price[] = [];
  for (const item of list) {
    const entry = record(item);
    if (!entry || !isProPlanId(entry.plan)) continue; // plans this site does not know yet are skipped
    const amount = num(entry.amount);
    const currency = str(entry.currency);
    const display = str(entry.display_price);
    if (amount === null || !currency || !display) continue;
    prices.push({
      plan: entry.plan,
      // The plan decides the interval; the wire value may say "one_time" or null for lifetime.
      interval: PLAN_INTERVAL[entry.plan],
      amount,
      currency,
      display_price: display,
      tax_inclusive: entry.tax_inclusive === true,
    });
  }
  return prices;
}

/** `GET /billing/prices`. Pass `init` for caching (e.g. `{ next: { revalidate: 300 } }`). */
export function getPrices(init: RequestInit = {}): Promise<Price[]> {
  return call(async () => normalizePrices(await publicRequest<unknown>("/billing/prices", init)));
}

/* ---- entitlement */

export type FreeRoutineCreations = { used: number; limit: number };

export type Entitlement = {
  plan: ProPlan;
  source: ProSource | null;
  status: ProStatus | null;
  product_id: string | null;
  /** RFC 3339; null for lifetime and grants without an end. */
  expires_at: string | null;
  will_renew: boolean | null;
  billing_provider: BillingProvider | null;
  manage: ProManage | null;
  plan_interval: PlanInterval | "unknown" | null;
  /** Null when the server did not send a usable count. */
  free_routine_creations: FreeRoutineCreations | null;
  email_verification_required: boolean;
  guest_of: { email: string; name: string } | null;
  /** Direct mode only: the Portuguese legal invoice of the last web purchase; null when absent. */
  legal_invoice: LegalInvoice | null;
};

/**
 * The legal (certified) invoice a Direct-mode purchase gets, sent as
 * `legal_invoice` on the checkout status (never on the entitlement, whose
 * key set is frozen for the desktop; billing.md change 30):
 * `pending` while it is being issued (it is emailed), then `issued` with its
 * number and ATCUD. Servers without Direct mode never send it.
 */
export type LegalInvoice = {
  status: "pending" | "issued";
  number: string | null;
  atcud: string | null;
};

/** Reads `legal_invoice`; anything missing, malformed or with an unknown status is null. */
export function normalizeLegalInvoice(raw: unknown): LegalInvoice | null {
  const r = record(raw);
  if (!r) return null;
  const status = enumValue(r.status, ["pending", "issued"] as const);
  if (status !== "pending" && status !== "issued") return null;
  return { status, number: str(r.number), atcud: str(r.atcud) };
}

export function normalizeEntitlement(raw: unknown): Entitlement {
  const e = record(raw) ?? {};
  const free = record(e.free_routine_creations);
  const used = num(free?.used);
  const limit = num(free?.limit);
  const guest = record(e.guest_of);
  return {
    plan: enumValue(e.plan, ["free", "pro"] as const) ?? "free",
    source: proSource(e.source),
    status: enumValue(e.status, ["active", "grace"] as const),
    product_id: str(e.product_id),
    expires_at: str(e.expires_at),
    will_renew: bool(e.will_renew),
    billing_provider: billingProvider(e.billing_provider),
    manage: enumValue(e.manage, ["app_store", "stripe_portal"] as const),
    plan_interval: enumValue(e.plan_interval, ["month", "year", "lifetime"] as const),
    free_routine_creations: used !== null && limit !== null ? { used, limit } : null,
    email_verification_required: e.email_verification_required === true,
    guest_of: guest && typeof guest.email === "string"
      ? { email: guest.email, name: typeof guest.name === "string" ? guest.name : "" }
      : null,
    legal_invoice: normalizeLegalInvoice(e.legal_invoice),
  };
}

export function isPro(entitlement: Entitlement | null | undefined): boolean {
  return entitlement?.plan === "pro";
}

/** `GET /me/entitlement`. */
export function getEntitlement(token: string, signal?: AbortSignal): Promise<Entitlement> {
  return call(async () => normalizeEntitlement(await authedRequest<unknown>(token, "/me/entitlement", { signal })));
}

/* ---- checkout */

export type CheckoutRequest = { plan: ProPlanId; locale: string; return: BillingReturn };
export type CheckoutSession = { checkout_url: string; session_id: string };

/**
 * `POST /billing/checkout`. Resolves only with a URL on an allow-listed
 * Stripe Checkout host; navigate to `checkout_url` as returned. The body is
 * exactly `{plan, locale, return}`: the server builds the redirects and picks
 * the price, and answers 400 if a client sends `success_url`, `cancel_url` or
 * `price_id`. A 409 `conflict` (another checkout of this account is still
 * being created) is the `conflict` failure.
 */
export function startCheckout(token: string, input: CheckoutRequest): Promise<CheckoutSession> {
  return callNamingPro(token, async () => {
    const body: CheckoutRequest = { plan: input.plan, locale: input.locale, return: input.return };
    const raw = record(await authedRequest<unknown>(token, "/billing/checkout", jsonBody(body)));
    const url = allowedStripeUrl(raw?.checkout_url, "checkout");
    const sessionId = str(raw?.session_id);
    if (!url || !sessionId) throw refusedRedirect("checkout");
    return { checkout_url: url, session_id: sessionId };
  });
}

export type CheckoutStatus = {
  /** `open` after the buyer paid means a delayed payment method is still clearing. */
  status: "open" | "complete" | "expired" | "unknown";
  /** True once the payment has turned Pro on for this account. */
  entitled: boolean;
  /** `TOONE-…`, the reference the login-free contract form asks for; null when absent or malformed. */
  order_ref: string | null;
  /** Direct mode only; null when absent. */
  legal_invoice: LegalInvoice | null;
};

/** `TOONE-` and 8–64 letters or digits (the server's `ParseOrderRef`, any case). */
const ORDER_REF = /^TOONE-[A-Z0-9]{8,64}$/i;

/** The order reference in its canonical (upper-case) form, or null when it cannot be one. */
export function normalizeOrderRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ref = value.trim().toUpperCase();
  return ORDER_REF.test(ref) ? ref : null;
}

export function normalizeCheckoutStatus(raw: unknown): CheckoutStatus {
  const r = record(raw) ?? {};
  return {
    status: enumValue(r.status, ["open", "complete", "expired"] as const) ?? "unknown",
    entitled: r.entitled === true,
    order_ref: normalizeOrderRef(r.order_ref),
    legal_invoice: normalizeLegalInvoice(r.legal_invoice),
  };
}

/** `GET /billing/checkout/{session_id}` (owner only). */
export function getCheckoutStatus(token: string, sessionId: string, signal?: AbortSignal): Promise<CheckoutStatus> {
  return call(async () => normalizeCheckoutStatus(
    await authedRequest<unknown>(token, `/billing/checkout/${encodeURIComponent(sessionId)}`, { signal }),
  ));
}

/* ---- customer portal */

/** `POST /billing/portal`. Resolves only with a URL on the Stripe billing host. */
export function startPortal(token: string, input: { locale: string; return: BillingReturn }): Promise<{ url: string }> {
  return call(async () => {
    const raw = record(await authedRequest<unknown>(token, "/billing/portal", jsonBody({ locale: input.locale, return: input.return })));
    const url = allowedStripeUrl(raw?.url ?? raw?.portal_url, "portal");
    if (!url) throw refusedRedirect("portal");
    return { url };
  });
}

/* ---- login-free contract requests (withdrawal / cancellation) */

export type ContractKind = "withdraw" | "cancel";

export type ContractRequest = {
  kind: ContractKind;
  email: string;
  order_ref: string;
  /** Site locale; the emailed link and the emails use it. The server defaults to `en`. */
  locale?: string;
  /** Optional, at most 200 characters; stored with the request. */
  name?: string;
};

/** The server's limit for `name` (characters). */
export const CONTRACT_NAME_MAX = 200;

/**
 * `POST /billing/contract-requests`. The server emails a confirmation link;
 * resolving only means the request was accepted, not that anything changed.
 * An empty name is left out.
 */
export function submitContractRequest(input: ContractRequest): Promise<void> {
  return call(async () => {
    const body: Record<string, string> = { kind: input.kind, email: input.email.trim(), order_ref: input.order_ref.trim() };
    if (input.locale) body.locale = input.locale;
    const name = input.name?.trim();
    if (name) body.name = name;
    await publicRequest<unknown>("/billing/contract-requests", { ...jsonBody(body), cache: "no-store" });
  });
}

export type ContractOutcomeKind = "cancelled" | "withdrawn" | "nothing_to_cancel";

export type ContractConfirmation = {
  kind: ContractKind | "unknown";
  outcome: ContractOutcomeKind | "unknown";
};

/**
 * `POST /billing/contract-requests/confirm` with the token from the emailed
 * link. Carries the request out once; confirming again returns the first
 * outcome. 404 (`unknown`, status 404) means the link expired or is unknown.
 */
export function confirmContractRequest(token: string): Promise<ContractConfirmation> {
  return call(async () => {
    const raw = record(await publicRequest<unknown>("/billing/contract-requests/confirm", {
      ...jsonBody({ token }),
      cache: "no-store",
    })) ?? {};
    return {
      kind: enumValue(raw.kind, ["withdraw", "cancel"] as const) ?? "unknown",
      outcome: enumValue(raw.outcome, ["cancelled", "withdrawn", "nothing_to_cancel"] as const) ?? "unknown",
    };
  });
}

/* ---- redeemable codes */

export type CodeBenefitKind = "none" | "pro_days" | "pro_lifetime" | "free_creations";
export type CodeBenefit = {
  kind: CodeBenefitKind | "unknown";
  /** Days for `pro_days`, creations for `free_creations`, null otherwise. */
  value: number | null;
};

export const CODE_BENEFIT_KINDS: readonly CodeBenefitKind[] = ["none", "pro_days", "pro_lifetime", "free_creations"];

/** Reads `benefit: {kind, value}` (or flat `benefit_kind` / `benefit_value`). Missing means none. */
export function normalizeBenefit(raw: unknown): CodeBenefit {
  const outer = record(raw) ?? {};
  const nested = record(outer.benefit);
  const kind = enumValue(nested ? nested.kind : outer.benefit_kind, CODE_BENEFIT_KINDS) ?? "none";
  const value = num(nested ? nested.value : outer.benefit_value);
  return { kind, value: kind === "pro_days" || kind === "free_creations" || kind === "unknown" ? value : null };
}

export type CodeCheck = {
  benefit: CodeBenefit;
  /** Always true on a 200: every refusal is the error `redeem` would return. */
  redeemable: boolean;
};
export type CodeRedemption = { benefit: CodeBenefit; entitlement: Entitlement };

function codeBody(code: string): RequestInit {
  const trimmed = code.trim();
  if (!trimmed) throw new BillingError({ kind: "invalid_code" });
  return jsonBody({ code: trimmed });
}

/** `POST /me/codes/check`: what the code would give this account, without using it. */
export function checkCode(token: string, code: string): Promise<CodeCheck> {
  return callNamingPro(token, async () => {
    const raw = record(await authedRequest<unknown>(token, "/me/codes/check", codeBody(code)));
    return { benefit: normalizeBenefit(raw), redeemable: raw?.redeemable !== false };
  });
}

/** `POST /me/codes/redeem`: uses the code and returns the updated entitlement. */
export function redeemCode(token: string, code: string): Promise<CodeRedemption> {
  return callNamingPro(token, async () => {
    const raw = record(await authedRequest<unknown>(token, "/me/codes/redeem", codeBody(code)));
    return { benefit: normalizeBenefit(raw), entitlement: normalizeEntitlement(raw?.entitlement) };
  });
}

export type InvitationPreviewWithBenefit = InvitationPreview & {
  benefit: CodeBenefit;
  /** False for codes that only grant a benefit to existing accounts. */
  admits_signup: boolean;
};

/** `POST /auth/invite/check` with the code's benefit (public; nothing is used up). */
export function checkInvitationBenefit(code: string): Promise<InvitationPreviewWithBenefit> {
  return call(async () => {
    const raw = record(await publicRequest<unknown>("/auth/invite/check", { ...codeBody(code), cache: "no-store" })) ?? {};
    return {
      valid: raw.valid === true,
      shared: raw.shared === true,
      label: typeof raw.label === "string" ? raw.label : "",
      expires_at: typeof raw.expires_at === "string" ? raw.expires_at : "",
      benefit: normalizeBenefit(raw),
      admits_signup: raw.admits_signup !== false,
    };
  });
}

/* ---- admin: invitations with a benefit */

type CodeFields = {
  benefit: CodeBenefit;
  admits_signup: boolean;
  campaign: string;
  /** Account id of the admin who created the code; empty when unknown. */
  created_by: string;
};

export type AdminCodeInvitation = InvitationRecord & CodeFields;
export type CreatedCodeInvitation = CreatedInvitation & Omit<CodeFields, "created_by"> & {
  /** Server warnings about the new code, e.g. `unlimited_pro_code`; empty when none. */
  warnings: string[];
};

/** Admin create warning: unlimited uses and a Pro benefit. */
export const UNLIMITED_PRO_CODE_WARNING = "unlimited_pro_code";

function codeFields(raw: Raw): CodeFields {
  return {
    benefit: normalizeBenefit(raw),
    admits_signup: raw.admits_signup !== false,
    campaign: typeof raw.campaign === "string" ? raw.campaign : "",
    created_by: typeof raw.created_by === "string" ? raw.created_by : "",
  };
}

/** `GET /admin/invitations`, with benefit fields. */
export function listCodeInvitations(token: string): Promise<AdminCodeInvitation[]> {
  return call(async () => {
    const raw = await authedRequest<unknown>(token, "/admin/invitations");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap(item => {
      const entry = record(item);
      return entry ? [{ ...(entry as unknown as InvitationRecord), ...codeFields(entry) }] : [];
    });
  });
}

export type CreateCodeInvitationInput = {
  recipient_name: string;
  code: string;
  days: number;
  max_uses?: number;
  expires_at?: string;
  email?: string;
  benefit?: { kind: CodeBenefitKind; value?: number };
  admits_signup?: boolean;
  campaign?: string;
};

/** `POST /admin/invitations`. A `pro_lifetime` or `none` benefit is sent without a value. */
export function createCodeInvitation(token: string, input: CreateCodeInvitationInput): Promise<CreatedCodeInvitation> {
  return call(async () => {
    const body: Record<string, unknown> = { ...input };
    if (input.benefit) {
      const { kind, value } = input.benefit;
      body.benefit = kind === "pro_days" || kind === "free_creations" ? { kind, value } : { kind };
    }
    const raw = record(await authedRequest<unknown>(token, "/admin/invitations", jsonBody(body))) ?? {};
    const { created_by: _createdBy, ...fields } = codeFields(raw);
    const warnings = Array.isArray(raw.warnings)
      ? raw.warnings.filter((warning): warning is string => typeof warning === "string" && warning !== "")
      : [];
    return { ...(raw as unknown as CreatedInvitation), ...fields, warnings };
  });
}

/** `DELETE /admin/invitations/{id}`. */
export function revokeCodeInvitation(token: string, id: string): Promise<void> {
  return call(async () => {
    await authedRequest<void>(token, `/admin/invitations/${encodeURIComponent(id)}`, { method: "DELETE" });
  });
}

/* The redemption ledger (cursor paging) lives in `./redemptions`. */

/* ---- feature flags (public) */

export type BillingFeatures = {
  /** Show the web checkout (pricing buttons, success page polling). */
  stripe_pro_checkout: boolean;
  /** Show "Manage subscription" for Stripe-billed accounts. */
  billing_portal: boolean;
  /** Show the redeem field and the code benefit tools. */
  pro_codes: boolean;
  /** `contracts.payments`; 0 when payments are off. */
  payments_contract: number;
};

export const BILLING_FEATURES_OFF: Readonly<BillingFeatures> = Object.freeze({
  stripe_pro_checkout: false,
  billing_portal: false,
  pro_codes: false,
  payments_contract: 0,
});

/** Reads the flags from `GET /capabilities`; anything missing or malformed is off. */
export function normalizeBillingFeatures(raw: unknown): BillingFeatures {
  const features = record(record(raw)?.features) ?? {};
  const contracts = record(record(raw)?.contracts) ?? {};
  return {
    stripe_pro_checkout: features.stripe_pro_checkout === true,
    billing_portal: features.billing_portal === true,
    pro_codes: features.pro_codes === true,
    payments_contract: num(contracts.payments) ?? 0,
  };
}

/** `GET /capabilities`. Pass `init` for caching. */
export function getBillingFeatures(init: RequestInit = {}): Promise<BillingFeatures> {
  return call(async () => normalizeBillingFeatures(await publicRequest<unknown>("/capabilities", init)));
}

/** Like `getBillingFeatures`, but every failure reads as "all off". */
export function getBillingFeaturesOrOff(init: RequestInit = {}): Promise<BillingFeatures> {
  return getBillingFeatures(init).catch(() => ({ ...BILLING_FEATURES_OFF }));
}
