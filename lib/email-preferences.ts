/**
 * Product emails (news and updates): the signed-in account page's switch
 * and the login-free one-click unsubscribe link. Account emails such as
 * receipts and security messages are not covered and always arrive.
 *
 * Calls throw `ApiError` (status 401 ends the session on the account page).
 */

import { ApiError, apiBase, apiErrorFrom, authedRequest } from "./api";

export type EmailPreferences = { productUpdates: boolean };

function preferencesFrom(raw: unknown): EmailPreferences {
  const value = (raw && typeof raw === "object" ? raw : {}) as { product_updates?: unknown };
  if (typeof value.product_updates !== "boolean") throw new ApiError("unknown", "Unexpected email preferences", 0);
  return { productUpdates: value.product_updates };
}

/** `GET /account/email-preferences`. */
export async function getEmailPreferences(token: string): Promise<EmailPreferences> {
  return preferencesFrom(await authedRequest<unknown>(token, "/account/email-preferences"));
}

/** `PUT /account/email-preferences`: turns product emails on or off and returns what was stored. */
export async function setProductUpdates(token: string, productUpdates: boolean): Promise<EmailPreferences> {
  return preferencesFrom(await authedRequest<unknown>(token, "/account/email-preferences", {
    method: "PUT",
    body: JSON.stringify({ product_updates: productUpdates }),
  }));
}

/**
 * Query parameter of the unsubscribe link in product emails
 * (`/unsubscribe?t=<token>`), the same one the API's List-Unsubscribe URL uses.
 */
export const UNSUBSCRIBE_TOKEN_PARAM = "t";

type UnsubscribeWindow = {
  location: { pathname: string; search: string; hash: string };
  history: { state: unknown; replaceState(data: unknown, unused: string, url?: string | URL | null): void };
};

/**
 * The token in an unsubscribe link, or null when there is none. Taking it
 * removes it from the address (kept in memory only), so it never reaches
 * page-view analytics or a shared URL.
 */
export function takeUnsubscribeToken(win: UnsubscribeWindow): string | null {
  const params = new URLSearchParams(win.location.search);
  const token = params.get(UNSUBSCRIBE_TOKEN_PARAM)?.trim() || null;
  if (params.has(UNSUBSCRIBE_TOKEN_PARAM)) {
    params.delete(UNSUBSCRIBE_TOKEN_PARAM);
    const search = params.toString();
    win.history.replaceState(win.history.state, "", `${win.location.pathname}${search ? `?${search}` : ""}${win.location.hash}`);
  }
  return token;
}

/**
 * `POST /email/unsubscribe` with `{token}`, no sign-in. Resolves once the
 * account behind the token is unsubscribed from product emails (repeats
 * succeed too); a 400 means the link is broken.
 */
export async function unsubscribeProductEmails(token: string): Promise<void> {
  const res = await fetch(`${apiBase()}/email/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body (proxy error page etc.)
  }
  if (!res.ok) throw apiErrorFrom(body, res.status);
  const data = (body && typeof body === "object" ? (body as { data?: { unsubscribed?: unknown } }).data : null) ?? null;
  if (data?.unsubscribed !== true) throw new ApiError("unknown", "Unsubscribe was not confirmed", res.status);
}
