/**
 * Affiliates: creator vanity links (`/r/{slug}`) that carry a Stripe discount
 * to the checkout, the creator dashboard and the admin panel.
 */

import { apiBase, apiErrorFrom, authedRequest } from "./api";

export type AffiliateDiscountDuration = "once" | "forever" | "repeating";
export type AffiliateDiscountScope = "all" | "lifetime";
export type AffiliateStatus = "active" | "paused";

export type AffiliateDiscount = {
  percent: number;
  duration: AffiliateDiscountDuration;
  months: number | null;
  scope: AffiliateDiscountScope;
};

export type AffiliateSales = {
  currency: string;
  sales: number;
  revenue: number;
  refunded: number;
  payable_revenue: number;
  commission: number;
  payable_commission: number;
};

export type AffiliateCreator = {
  invitation_id: string;
  code_hint: string;
  status: "pending" | "joined" | "expired" | "revoked";
  expires_at: string | null;
  joined: boolean;
  account_id: string | null;
};

export type Affiliate = {
  id: string;
  slug: string;
  name: string;
  status: AffiliateStatus;
  link: string;
  promotion_code: string;
  discount: AffiliateDiscount | null;
  discount_text: string;
  commission_percent: number;
  visits: number;
  sales: AffiliateSales[];
  created_at: string;
  provider_managed?: boolean;
  creator?: AffiliateCreator;
};

export type CreatedAffiliate = {
  affiliate: Affiliate;
  creator_code: string;
  creator_join_url: string;
  email_queued: boolean;
};

export type PublicAffiliate = {
  slug: string;
  name: string;
  promotion_code: string;
  discount: AffiliateDiscount | null;
  discount_text: string;
};

export type CreateAffiliateInput = {
  name: string;
  slug: string;
  discount?: AffiliateDiscount;
  existing_promotion_code?: string;
  commission_percent: number;
  creator_email?: string;
};

export type UpdateAffiliateInput = { status?: AffiliateStatus; commission_percent?: number; name?: string };

/* ---- rules shared with the server */

export const SLUG_MIN = 3;
export const SLUG_MAX = 32;
export const DISCOUNT_MIN = 5;
export const DISCOUNT_MAX = 90;
export const MONTHS_MAX = 36;
export const COMMISSION_MAX = 50;

const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "billing", "creators", "download", "explore", "help", "invite", "journal", "legal", "login",
  "pricing", "privacy", "pro", "redeem", "root", "security", "signin", "signup", "staff", "support", "terms", "toone",
  "trytoone", "www",
]);

/** A slug suggestion from a name: lowercase letters, digits and single hyphens. */
export function slugFromName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

/** Null when the slug is valid, else what is wrong with it. */
export function slugProblem(slug: string): string | null {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return `Use ${SLUG_MIN} to ${SLUG_MAX} characters.`;
  if (!/^[a-z0-9-]+$/.test(slug)) return "Use lowercase letters, digits and hyphens only.";
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) return "Start and end with a letter or digit, no double hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "This word is reserved for Toone pages.";
  const code = slug.replace(/-/g, "");
  if (code.length < SLUG_MIN) return "The checkout code (the link without hyphens) needs at least 3 characters.";
  if (RESERVED_SLUGS.has(code)) return "Without hyphens this spells a word reserved for Toone pages.";
  return null;
}

/** The public checkout code for a slug, as the server makes it. */
export function promotionCodeFromSlug(slug: string): string {
  return slug.replace(/-/g, "").toUpperCase();
}

/** "20% off the first payment", matching the server's wording. */
export function discountText(discount: AffiliateDiscount | null): string {
  if (!discount) return "Discount set in Stripe";
  if (discount.scope === "lifetime") return `${discount.percent}% off Toone Pro Lifetime`;
  if (discount.duration === "forever") return `${discount.percent}% off every payment`;
  if (discount.duration === "repeating") {
    const months = discount.months ?? 0;
    return `${discount.percent}% off the first ${months} month${months === 1 ? "" : "s"}`;
  }
  return `${discount.percent}% off the first payment`;
}

/** Minor units to a money string, e.g. 19999 eur → "€199.99". */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/* ---- API */

export function listAffiliates(token: string): Promise<Affiliate[]> {
  return authedRequest<Affiliate[]>(token, "/admin/affiliates").then(list => (Array.isArray(list) ? list : []));
}

export function createAffiliate(token: string, input: CreateAffiliateInput): Promise<CreatedAffiliate> {
  return authedRequest<CreatedAffiliate>(token, "/admin/affiliates", { method: "POST", body: JSON.stringify(input) });
}

export function updateAffiliate(token: string, id: string, input: UpdateAffiliateInput): Promise<Affiliate> {
  return authedRequest<Affiliate>(token, `/admin/affiliates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function newCreatorCode(token: string, id: string, creatorEmail?: string): Promise<CreatedAffiliate> {
  return authedRequest<CreatedAffiliate>(token, `/admin/affiliates/${encodeURIComponent(id)}/creator-code`, {
    method: "POST",
    body: JSON.stringify(creatorEmail ? { creator_email: creatorEmail } : {}),
  });
}

/** The signed-in creator's affiliate; null when the account is not a creator. */
export async function myAffiliate(token: string): Promise<Affiliate | null> {
  try {
    return await authedRequest<Affiliate>(token, "/me/affiliate");
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 404) return null;
    throw error;
  }
}

/** The vanity link's affiliate; null for an unknown or paused link. Counts a visit. */
export async function lookupAffiliate(slug: string, signal?: AbortSignal): Promise<PublicAffiliate | null> {
  const res = await fetch(`${apiBase()}/affiliates/${encodeURIComponent(slug)}`, { cache: "no-store", signal });
  if (res.status === 404) return null;
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body
  }
  if (!res.ok) throw apiErrorFrom(body, res.status);
  const data = (body as { data?: PublicAffiliate } | null)?.data;
  return data && typeof data.promotion_code === "string" ? data : null;
}

/* ---- the referral this browser came through */

const STORAGE_KEY = "toone.affiliate";
/** How long a vanity link keeps its discount and attribution in this browser. Last link wins. */
export const ATTRIBUTION_DAYS = 60;

export type RememberedAffiliate = {
  slug: string;
  name: string;
  code: string;
  discount: AffiliateDiscount | null;
  savedAt: number;
};

/** Keeps the affiliate for the checkout, replacing any earlier one. */
export function rememberAffiliate(affiliate: PublicAffiliate, now: Date = new Date()): void {
  const value: RememberedAffiliate = {
    slug: affiliate.slug,
    name: affiliate.name,
    code: affiliate.promotion_code,
    discount: affiliate.discount,
    savedAt: now.getTime(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // No storage: the discount can still be typed at the payment page.
    }
  }
}

/** A remembered discount only when it is one the server could have made (whole 5-90%). */
function validDiscount(discount: unknown): AffiliateDiscount | null {
  const d = discount as Partial<AffiliateDiscount> | null | undefined;
  if (!d || !Number.isInteger(d.percent) || (d.percent as number) < DISCOUNT_MIN || (d.percent as number) > DISCOUNT_MAX) return null;
  if (d.scope !== "all" && d.scope !== "lifetime") return null;
  return { percent: d.percent as number, duration: d.duration === "forever" || d.duration === "repeating" ? d.duration : "once", months: typeof d.months === "number" ? d.months : null, scope: d.scope };
}

function parseRemembered(raw: string | null, now: Date): RememberedAffiliate | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RememberedAffiliate>;
    if (typeof value.code !== "string" || !/^[A-Z0-9]{3,40}$/.test(value.code)) return null;
    if (typeof value.savedAt !== "number" || now.getTime() - value.savedAt > ATTRIBUTION_DAYS * 86_400_000) return null;
    return {
      slug: typeof value.slug === "string" ? value.slug : "",
      name: typeof value.name === "string" ? value.name : "",
      code: value.code,
      discount: validDiscount(value.discount),
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}

/** The affiliate this browser came through within the attribution window. */
export function rememberedAffiliate(now: Date = new Date()): RememberedAffiliate | null {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const found = parseRemembered(window[storage].getItem(STORAGE_KEY), now);
      if (found) return found;
    } catch {
      // Storage refused: try the other one.
    }
  }
  return null;
}

/** Whether the affiliate's discount applies to a plan (a lifetime-only code skips subscriptions). */
export function affiliateAppliesTo(affiliate: RememberedAffiliate | null, plan: string): boolean {
  if (!affiliate) return false;
  return affiliate.discount?.scope !== "lifetime" || plan === "pro_lifetime";
}

/** The affiliate code to send with a checkout of this plan, or null. */
export function affiliatePromotionFor(plan: string, now: Date = new Date()): string | null {
  const affiliate = rememberedAffiliate(now);
  return affiliate && affiliateAppliesTo(affiliate, plan) ? affiliate.code : null;
}

/**
 * The price with a percent discount, written like `displayPrice` (same
 * symbol, position and decimal separator); null without a usable amount.
 * Stripe rounds the discount, then subtracts it; it computes what is charged.
 */
export function percentOffPrice(percent: number, amount: number, displayPrice: string): string | null {
  if (!Number.isFinite(percent) || percent <= 0 || !Number.isFinite(amount) || amount <= 0) return null;
  const discounted = amount - Math.round((amount * percent) / 100);
  const number = displayPrice.match(/\d[\d.,   ]*\d|\d/);
  if (!number) return null;
  const decimalComma = /,\d{2}$/.test(number[0]);
  const text = (discounted / 100).toFixed(2);
  return displayPrice.replace(number[0], decimalComma ? text.replace(".", ",") : text);
}

/* ---- admin API tokens: scripts call the affiliates admin routes without a browser session */

export type AdminApiTokenScope = "affiliates";

export type AdminApiToken = {
  id: string;
  name: string;
  scopes: AdminApiTokenScope[];
  /** The token's last four characters. */
  token_hint: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

/** Only the create response carries the token itself, once. */
export type CreatedAdminApiToken = AdminApiToken & { token: string };

export type CreateAdminApiTokenInput = { name: string; scopes?: AdminApiTokenScope[]; expires_in_days?: number };

export const ADMIN_TOKEN_NAME_MAX = 80;

/** Null when the token name is valid, else what is wrong with it. */
export function adminTokenNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Give the token a name, e.g. where it will be used.";
  if ([...trimmed].length > ADMIN_TOKEN_NAME_MAX) return `Use at most ${ADMIN_TOKEN_NAME_MAX} characters.`;
  if (/[\r\n\t]/.test(trimmed)) return "Use one line.";
  return null;
}

/** Whether a token still works at `now`. */
export function adminTokenState(token: AdminApiToken, now: Date = new Date()): "active" | "revoked" | "expired" {
  if (token.revoked_at) return "revoked";
  if (token.expires_at && new Date(token.expires_at).getTime() <= now.getTime()) return "expired";
  return "active";
}

export function listAdminTokens(token: string): Promise<AdminApiToken[]> {
  return authedRequest<AdminApiToken[]>(token, "/admin/api-tokens").then(list => (Array.isArray(list) ? list : []));
}

export function createAdminToken(token: string, input: CreateAdminApiTokenInput): Promise<CreatedAdminApiToken> {
  return authedRequest<CreatedAdminApiToken>(token, "/admin/api-tokens", {
    method: "POST",
    body: JSON.stringify({ scopes: ["affiliates"], ...input, name: input.name.trim() }),
  });
}

export function revokeAdminToken(token: string, id: string): Promise<AdminApiToken> {
  return authedRequest<AdminApiToken>(token, `/admin/api-tokens/${encodeURIComponent(id)}/revoke`, { method: "POST" });
}
