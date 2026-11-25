/**
 * The consent page (`/connect?request=car_…`): an assistant such as Claude
 * sends the person here during sign-in to connect their Toone account. The
 * page reads the pending request with the person's Toone session, shows who
 * is asking and what it may do, and posts the decision. The Toone API answers
 * with the address to send the browser to (the assistant's callback with a
 * one-time code, or with `error=access_denied`).
 *
 * The session travels as a bearer token. The two consent calls also carry
 * the API's own cookies (`credentials: "include"`): the API binds a pending
 * request to the browser that started it with the `__Host-toone_consent`
 * cookie on api.trytoone.com (security review M1, consent-page.md §3), so a
 * forwarded link cannot be approved in someone else's browser. The page never
 * reads or writes that cookie. The OAuth `state` is the API's business: the page
 * never reads, changes or shows `redirect_to`, it only checks that it points
 * at the host the API announced for this request and then navigates there.
 */

import { ApiError, authedRequest } from "@/lib/api";

/** `car_` and the lowercase base32 the API generates; anything else never reaches the API. */
const REQUEST_ID = /^car_[a-z0-9]{1,64}$/;

/** The request id from the page's query, or null when it is missing or malformed. */
export function parseRequestId(value: string | string[] | null | undefined): string | null {
  const id = Array.isArray(value) ? (value.length === 1 ? value[0] : null) : value;
  return typeof id === "string" && REQUEST_ID.test(id) ? id : null;
}

/**
 * `claude` / `chatgpt`: the code goes to one of that assistant's own
 * callbacks. `local`: to a program on this computer (a loopback address).
 * `other`: anywhere else.
 */
export type ClientKind = "claude" | "chatgpt" | "local" | "other";

/** The assistant's name when the API vouches for it (its own callbacks), else null. */
export function assistantName(kind: ClientKind | null): string | null {
  return kind === "claude" ? "Claude" : kind === "chatgpt" ? "ChatGPT" : null;
}

/**
 * The view field by which the API says the decision may name a Mac. Lane C2
 * adds it; until consent-page.md names it, both spellings are read.
 */
export const MAC_CHOICE_VIEW_FIELDS = ["mac_choice", "macChoice"] as const;
/** The decision field carrying the chosen Mac (consent-page.md §3.2). */
export const MAC_CHOICE_DECISION_FIELD = "mac_id";

/**
 * The API's answer when the request was started in another browser (M1,
 * consent-page.md §3). Any other unexpected 403 is treated the same way.
 */
export const OTHER_BROWSER_CODES: ReadonlySet<string> = new Set(["consent_other_browser"]);

/** The two consent calls send the API's own cookies along with the bearer. */
const WITH_API_COOKIES: RequestInit = { credentials: "include" };
export type Scope = "read" | "act";
export type Ineligibility = "subscription_required" | "not_allowed";

export type ConsentRequest = {
  id: string;
  /** What the client called itself at registration. Anyone can say "Claude": never shown alone. */
  clientName: string;
  /** Where the code goes (`claude.ai`, `localhost`…). */
  redirectHost: string;
  clientKind: ClientKind;
  scopes: Scope[];
  /** RFC 3339. */
  expiresAt: string;
  eligible: boolean;
  /** Set when not eligible; an unknown reason counts as not allowed. */
  ineligibleReason: Ineligibility | null;
  /** The API accepts a chosen Mac with the decision. */
  macChoice: boolean;
  /**
   * How the connection may act, when the API takes a choice (`access_modes`,
   * consent-page.md §3.1, owner decision A): `auto` runs actions without
   * asking again on the Mac, `ask` asks on the Mac each time. Empty: no choice.
   */
  accessModes: AccessMode[];
  /** This account already pressed Allow and a code was emailed (a reloaded page goes straight to the code). */
  codePending: CodePending | null;
};

export type AccessMode = "ask" | "auto";

/**
 * Allow is confirmed with a 6-digit code emailed to the account (a new
 * connection only takes effect once the code is entered). Directory review
 * accounts skip it: the API then answers the decision with `redirect_to`.
 */
export type CodePending = {
  /** The account's address, masked by the API (`m•••@example.com`). */
  emailHint: string;
  /** RFC 3339; the code and the request lapse then. */
  codeExpiresAt: string;
  resendsLeft: number;
  attemptsLeft: number;
};

const count = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;

/** The API's `code_required` answer (decision, resend) or `code_pending` (request view), or null. */
export function normalizeCodePending(raw: unknown): CodePending | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  if (typeof entry.email_hint !== "string" && typeof entry.code_expires_at !== "string") return null;
  return {
    emailHint: text(entry.email_hint).trim(),
    codeExpiresAt: text(entry.code_expires_at),
    resendsLeft: count(entry.resends_left, 0),
    attemptsLeft: count(entry.attempts_left, 0),
  };
}

/** A code as the person may type it: digits only, at most 6. */
export function cleanCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

/**
 * Whether a Mac's Toone lets online assistants in (`connector_enabled` on
 * `GET /v1/macs`): `on`, `off` (its switch is off), or `update` (that Toone
 * never reported it: too old). Undefined when the API did not say.
 */
export type MacAssistants = "on" | "off" | "update";

export type ConnectorMac = { id: string; name: string; assistants?: MacAssistants };

const text = (value: unknown) => (typeof value === "string" ? value : "");

type RawConsentRequest = {
  id?: unknown; client_name?: unknown; redirect_host?: unknown; client_kind?: unknown;
  scopes?: unknown; expires_at?: unknown; eligible?: unknown; ineligible_reason?: unknown;
  [field: string]: unknown;
};


/** Normalizes the API's answer; unknown values fall to the cautious side. */
export function normalizeConsentRequest(raw: RawConsentRequest): ConsentRequest {
  const kind = text(raw.client_kind);
  const scopes = Array.isArray(raw.scopes)
    ? raw.scopes.filter((scope): scope is Scope => scope === "read" || scope === "act")
    : [];
  const eligible = raw.eligible === true;
  const reason = text(raw.ineligible_reason);
  return {
    id: text(raw.id),
    clientName: text(raw.client_name).trim(),
    redirectHost: text(raw.redirect_host).trim().toLowerCase(),
    clientKind: kind === "claude" || kind === "chatgpt" || kind === "local" ? kind : "other",
    scopes: scopes.includes("read") ? scopes : ["read", ...scopes],
    expiresAt: text(raw.expires_at),
    eligible,
    ineligibleReason: eligible ? null : reason === "subscription_required" ? "subscription_required" : "not_allowed",
    macChoice: MAC_CHOICE_VIEW_FIELDS.some((field) => raw[field] === true),
    accessModes: Array.isArray(raw.access_modes)
      ? (["ask", "auto"] as const).filter((mode) => (raw.access_modes as unknown[]).includes(mode))
      : [],
    codePending: normalizeCodePending(raw.code_pending),
  };
}

const path = (id: string) => `/connector/authorizations/${encodeURIComponent(id)}`;

/** `GET /v1/connector/authorizations/{id}`. */
export async function getConsentRequest(token: string, id: string): Promise<ConsentRequest> {
  return normalizeConsentRequest(await authedRequest<RawConsentRequest>(token, path(id), { ...WITH_API_COOKIES }));
}

/** What goes with Allow besides `approve`; Don't allow sends none of it. */
export type DecisionChoices = {
  /** Narrow the request to `["read"]`; otherwise the requested scopes stand. */
  readOnly?: boolean;
  /** The Mac the person picked (only when the API offers the choice); none: the Mac used last. */
  macId?: string | null;
  /** How the connection may act (only when the API offers the choice and acting is kept). */
  accessMode?: AccessMode | null;
};

/**
 * `POST /v1/connector/authorizations/{id}/decision`. Resolves to the API's
 * `redirect_to`, unchecked (see `safeRedirect`), or, for an Allow that must
 * be confirmed by email, to the code the API sent (`status: code_required`,
 * HTTP 202, no `redirect_to`).
 */
export async function postConsentDecision(token: string, id: string, approve: boolean, choices: DecisionChoices = {}): Promise<string | CodePending> {
  const body: Record<string, unknown> = { approve };
  if (approve && choices.readOnly) body.scopes = ["read"];
  if (approve && choices.macId) body[MAC_CHOICE_DECISION_FIELD] = choices.macId;
  if (approve && choices.accessMode && !choices.readOnly) body.access_mode = choices.accessMode;
  const data = await authedRequest<{ redirect_to?: unknown; status?: unknown }>(token, `${path(id)}/decision`, {
    ...WITH_API_COOKIES,
    method: "POST",
    body: JSON.stringify(body),
  });
  if (approve && data?.status === "code_required") {
    const pending = normalizeCodePending(data);
    if (pending) return pending;
  }
  return text(data?.redirect_to);
}

/** The API's answer to a code: approved (`code` in the address) or cancelled after too many wrong codes (`error`). */
export type CodeAnswer = { status: "approved" | "cancelled"; redirectTo: string };

/** `POST /v1/connector/authorizations/{id}/verify` with the emailed code. A wrong code throws `invalid_code` with `attempts_left`. */
export async function verifyConsentCode(token: string, id: string, code: string): Promise<CodeAnswer> {
  const data = await authedRequest<{ status?: unknown; redirect_to?: unknown }>(token, `${path(id)}/verify`, {
    ...WITH_API_COOKIES,
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return { status: data?.status === "approved" ? "approved" : "cancelled", redirectTo: text(data?.redirect_to) };
}

/** `POST /v1/connector/authorizations/{id}/resend`: a new code (the previous one stops working). */
export async function resendConsentCode(token: string, id: string): Promise<CodePending> {
  const data = await authedRequest<unknown>(token, `${path(id)}/resend`, { ...WITH_API_COOKIES, method: "POST" });
  const pending = normalizeCodePending(data);
  if (!pending) throw new ApiError("unknown", "no code pending", 500);
  return pending;
}

/** `GET /v1/me/connector/macs`: the account's Macs reachable now, most recently active first. */
export async function listConnectorMacs(token: string): Promise<ConnectorMac[]> {
  const data = await authedRequest<unknown>(token, "/me/connector/macs");
  if (!Array.isArray(data)) return [];
  return data.flatMap((raw) => {
    const mac = (raw ?? {}) as { mac_id?: unknown; name?: unknown };
    const id = text(mac.mac_id);
    return id ? [{ id, name: text(mac.name).trim() || "Mac" }] : [];
  });
}

/**
 * `GET /v1/macs`: the account's registered Macs that are active, open or not
 * (consent-page.md §3.1 `mac_choice`). Answers `{"macs": […]}` in the envelope.
 */
export async function listAccountMacs(token: string): Promise<ConnectorMac[]> {
  const data = await authedRequest<unknown>(token, "/macs");
  const list = Array.isArray(data) ? data : Array.isArray((data as { macs?: unknown } | null)?.macs) ? (data as { macs: unknown[] }).macs : [];
  return list.flatMap((raw) => {
    const mac = (raw ?? {}) as { id?: unknown; name?: unknown; state?: unknown; connector_enabled?: unknown };
    const id = text(mac.id);
    if (!id || mac.state !== "active") return [];
    const entry: ConnectorMac = { id, name: text(mac.name).trim() || "Mac" };
    // `null` means that Toone never reported the switch (too old); a missing field means the API did not say.
    if (mac.connector_enabled === true) entry.assistants = "on";
    else if (mac.connector_enabled === false) entry.assistants = "off";
    else if ("connector_enabled" in mac && mac.connector_enabled === null) entry.assistants = "update";
    return [entry];
  });
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * The address the browser may go to after a decision, or null. Only the
 * host the API showed for this request, over HTTPS (plain HTTP only to this
 * computer's own loopback address), with no credentials, carrying the answer
 * the decision should produce (`code` for Allow, `error` for Don't allow).
 * Anything else is refused: the page never becomes an open redirect, even if
 * the answer were tampered with.
 */
export function safeRedirect(redirectTo: string, request: Pick<ConsentRequest, "redirectHost">, approve: boolean): string | null {
  if (!redirectTo || !request.redirectHost) return null;
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.username || url.password) return null;
  if (host !== request.redirectHost) return null;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOOPBACK_HOSTS.has(host))) return null;
  if (!url.searchParams.has(approve ? "code" : "error")) return null;
  return url.href;
}

/** What the page shows after a failed call; `null` means "the decision can be tried again". */
export type ConsentFailure =
  | "signed-out"
  | "expired"
  | "unavailable"
  | "not-allowed"
  | "needs-pro"
  | "other-browser"
  | "rate-limited"
  | "page-error"
  | "unreachable";

/** Maps an API or network error to what the page says (contract §3.1, §3.2). */
export function consentFailure(error: unknown): ConsentFailure {
  if (!(error instanceof ApiError)) return "unreachable";
  if (OTHER_BROWSER_CODES.has(error.code)) return "other-browser";
  if (error.status === 401 || error.code === "unauthorized") return "signed-out";
  if (error.status === 404 || error.code === "not_found") return "expired";
  if (error.status === 503 || error.code === "service_unavailable") return "unavailable";
  if (error.code === "subscription_required") return "needs-pro";
  if (error.status === 403 && error.code === "forbidden") return "not-allowed";
  if (error.status === 403) return "other-browser";
  if (error.status === 429 || error.code === "rate_limit_exceeded") return "rate-limited";
  if (error.status === 400) return "page-error";
  return "unreachable";
}

/** A request lives five minutes (consent-page.md §1, since M1). */
export const REQUEST_LIFETIME_MS = 5 * 60_000;

/**
 * When the page should say the request lapsed, read right after loading it.
 * The API's clock is the truth and the device's may be wrong: a request the
 * API just served cannot have lapsed, so "already past" means a fast device
 * clock and no timer is set (a late decision still gets the API's answer);
 * a slow clock is capped at the request's lifetime.
 */
export function expiryTimerMs(request: Pick<ConsentRequest, "expiresAt">, now = Date.now(), cap = REQUEST_LIFETIME_MS): number | null {
  const left = msUntilExpiry(request, now);
  return left === null || left <= 0 ? null : Math.min(left, cap);
}

/** Milliseconds until the request lapses (0 when past), or null when the time is unreadable (the API still decides). */
export function msUntilExpiry(request: Pick<ConsentRequest, "expiresAt">, now = Date.now()): number | null {
  const at = Date.parse(request.expiresAt);
  return Number.isFinite(at) ? Math.max(0, at - now) : null;
}

/** This tab's note that a request was already answered, for the Back button (never the address or the code). */
const ANSWERED_KEY = (id: string) => `toone.connect.answered.${id}`;

export function rememberAnswer(id: string, approve: boolean): void {
  try { window.sessionStorage.setItem(ANSWERED_KEY(id), approve ? "allowed" : "denied"); } catch { /* private mode */ }
}

export function recallAnswer(id: string): "allowed" | "denied" | null {
  try {
    const value = window.sessionStorage.getItem(ANSWERED_KEY(id));
    return value === "allowed" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

/** How a decision ended: go to the checked address, refuse a bad one, or explain a failure. */
export type DecisionOutcome =
  | { kind: "navigate"; url: string }
  /** Allow must be confirmed with the code just emailed. */
  | { kind: "code"; pending: CodePending }
  | { kind: "bad-redirect" }
  | { kind: "failure"; failure: ConsentFailure };

/** What the person chose on the page. */
export type PageChoices = { allowAct: boolean; macId?: string | null; accessMode?: AccessMode | null };

/**
 * Posts the decision and checks the answer. `allowAct` false narrows a
 * request that asked to act down to reading only (and drops the access
 * mode). A Mac or an access mode goes only with Allow, and only when the API
 * offers that choice. Never throws.
 */
export async function decide(
  token: string,
  request: ConsentRequest,
  approve: boolean,
  page: PageChoices,
  post: typeof postConsentDecision = postConsentDecision,
): Promise<DecisionOutcome> {
  const acts = page.allowAct && request.scopes.includes("act");
  const choices: DecisionChoices = approve ? {
    readOnly: !page.allowAct && request.scopes.includes("act"),
    macId: request.macChoice ? page.macId ?? null : null,
    accessMode: acts && page.accessMode && request.accessModes.includes(page.accessMode) ? page.accessMode : null,
  } : {};
  try {
    const answer = await post(token, request.id, approve, choices);
    if (typeof answer !== "string") return approve ? { kind: "code", pending: answer } : { kind: "bad-redirect" };
    const url = safeRedirect(answer, request, approve);
    return url ? { kind: "navigate", url } : { kind: "bad-redirect" };
  } catch (error) {
    return { kind: "failure", failure: consentFailure(error) };
  }
}

/** How entering the code ended. */
export type CodeOutcome =
  /** Correct: go on with the code (`approve`), or too many wrong codes: back with `error` (`!approve`). */
  | { kind: "navigate"; url: string; approve: boolean }
  | { kind: "bad-redirect" }
  | { kind: "wrong"; attemptsLeft: number }
  /** Not 6 digits: nothing was sent to count as a try. */
  | { kind: "incomplete" }
  | { kind: "failure"; failure: ConsentFailure | "no-code" };

/** Sends the code and checks the answer. Never throws. */
export async function confirmWithCode(
  token: string,
  request: ConsentRequest,
  code: string,
  verify: typeof verifyConsentCode = verifyConsentCode,
): Promise<CodeOutcome> {
  const clean = cleanCode(code);
  if (clean.length !== 6) return { kind: "incomplete" };
  try {
    const answer = await verify(token, request.id, clean);
    const approve = answer.status === "approved";
    const url = safeRedirect(answer.redirectTo, request, approve);
    return url ? { kind: "navigate", url, approve } : { kind: "bad-redirect" };
  } catch (error) {
    if (error instanceof ApiError && error.code === "invalid_code") {
      return { kind: "wrong", attemptsLeft: count(error.fields?.attempts_left, 0) };
    }
    if (error instanceof ApiError && error.code === "invalid_input") return { kind: "incomplete" };
    if (error instanceof ApiError && (error.status === 409 || error.code === "conflict")) return { kind: "failure", failure: "no-code" };
    return { kind: "failure", failure: consentFailure(error) };
  }
}
