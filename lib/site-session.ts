import { cache } from "react";
import { cookies } from "next/headers";
import { apiBase } from "@/lib/api";

/**
 * Server-side sign-in (route handlers and server components only; it reads
 * request cookies) for pages only signed-in accounts may read (/how-to).
 *
 * The browser keeps its session in localStorage (`toone.session`), which the
 * server never sees. On sign-in the client also posts the token to
 * `/api/session`, which checks it with the Toone API and stores it in this
 * httpOnly cookie. A gated page reads the cookie and asks the API again
 * (`GET /me`) on every request, so a revoked or expired session stops working
 * at once and signed-out visitors and crawlers never receive the content.
 */
export const SITE_SESSION_COOKIE = "toone_site_session";

/** Whether `token` is a live session according to the Toone API. Fails closed. */
export async function isLiveSessionToken(token: string): Promise<boolean> {
  if (!token || token.length > 4096) return false;
  try {
    const res = await fetch(`${apiBase()}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** The request carries a live site session. Deduplicated per request (metadata + page). */
export const hasSiteSession = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value;
  return token ? isLiveSessionToken(token) : false;
});
