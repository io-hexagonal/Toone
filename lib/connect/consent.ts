/**
 * The consent page (`/connect?request=car_…`): an assistant such as Claude
 * sends the person here during sign-in to connect their Toone account. The
 * page reads the pending request with the person's Toone session, shows who
 * is asking and what it may do, and posts the decision. The Toone API answers
 * with the address to send the browser to (the assistant's callback with a
 * one-time code, or with `error=access_denied`).
 *
 * The session travels as a bearer token, never a cookie, so the API routes
 * have no CSRF surface. The OAuth `state` is the API's business: the page
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
 * `claude`: the code goes to one of Claude's own callbacks. `local`: to a
 * program on this computer (a loopback address). `other`: anywhere else.
 */
export type ClientKind = "claude" | "local" | "other";
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
};

export type ConnectorMac = { id: string; name: string };

type RawConsentRequest = {
  id?: unknown; client_name?: unknown; redirect_host?: unknown; client_kind?: unknown;
  scopes?: unknown; expires_at?: unknown; eligible?: unknown; ineligible_reason?: unknown;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");

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
    clientKind: kind === "claude" || kind === "local" ? kind : "other",
    scopes: scopes.includes("read") ? scopes : ["read", ...scopes],
    expiresAt: text(raw.expires_at),
    eligible,
    ineligibleReason: eligible ? null : reason === "subscription_required" ? "subscription_required" : "not_allowed",
  };
}

const path = (id: string) => `/connector/authorizations/${encodeURIComponent(id)}`;

/** `GET /v1/connector/authorizations/{id}`. */
export async function getConsentRequest(token: string, id: string): Promise<ConsentRequest> {
  return normalizeConsentRequest(await authedRequest<RawConsentRequest>(token, path(id)));
}

/**
 * `POST /v1/connector/authorizations/{id}/decision`. With `readOnly` the
 * request is narrowed to `["read"]`; otherwise the requested scopes stand.
 * Resolves to the API's `redirect_to`, unchecked (see `safeRedirect`).
 */
export async function postConsentDecision(token: string, id: string, approve: boolean, readOnly = false): Promise<string> {
  const body = approve && readOnly ? { approve, scopes: ["read"] } : { approve };
  const data = await authedRequest<{ redirect_to?: unknown }>(token, `${path(id)}/decision`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return text(data?.redirect_to);
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
  | "rate-limited"
  | "page-error"
  | "unreachable";

/** Maps an API or network error to what the page says (contract §3.1, §3.2). */
export function consentFailure(error: unknown): ConsentFailure {
  if (!(error instanceof ApiError)) return "unreachable";
  if (error.status === 401 || error.code === "unauthorized") return "signed-out";
  if (error.status === 404 || error.code === "not_found") return "expired";
  if (error.status === 503 || error.code === "service_unavailable") return "unavailable";
  if (error.code === "subscription_required") return "needs-pro";
  if (error.status === 403) return "not-allowed";
  if (error.status === 429 || error.code === "rate_limit_exceeded") return "rate-limited";
  if (error.status === 400) return "page-error";
  return "unreachable";
}

/** Milliseconds until the request lapses (0 when past), or null when the time is unreadable (the API still decides). */
export function msUntilExpiry(request: Pick<ConsentRequest, "expiresAt">, now = Date.now()): number | null {
  const at = Date.parse(request.expiresAt);
  return Number.isFinite(at) ? Math.max(0, at - now) : null;
}

/** How a decision ended: go to the checked address, refuse a bad one, or explain a failure. */
export type DecisionOutcome =
  | { kind: "navigate"; url: string }
  | { kind: "bad-redirect" }
  | { kind: "failure"; failure: ConsentFailure };

/**
 * Posts the decision and checks the answer. `allowAct` false narrows a
 * request that asked to act down to reading only. Never throws.
 */
export async function decide(
  token: string,
  request: ConsentRequest,
  approve: boolean,
  allowAct: boolean,
  post: typeof postConsentDecision = postConsentDecision,
): Promise<DecisionOutcome> {
  const readOnly = approve && !allowAct && request.scopes.includes("act");
  try {
    const redirectTo = await post(token, request.id, approve, readOnly);
    const url = safeRedirect(redirectTo, request, approve);
    return url ? { kind: "navigate", url } : { kind: "bad-redirect" };
  } catch (error) {
    return { kind: "failure", failure: consentFailure(error) };
  }
}
