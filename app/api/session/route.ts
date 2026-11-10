import { NextRequest, NextResponse } from "next/server";
import { SITE_SESSION_COOKIE, isLiveSessionToken } from "@/lib/site-session";

/**
 * Mirrors the browser's session into an httpOnly cookie the server can read
 * (lib/site-session.ts). POST `{ token, expiresAt }` after sign-in; DELETE on
 * sign-out. The token is checked with the Toone API before it is stored.
 */

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Only this site's own pages may set or clear the cookie: the browser's
 * `Origin` must name the host the request was sent to. (`nextUrl.origin` is
 * not used: Next normalizes its host, e.g. 127.0.0.1 → localhost.)
 */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}

function noStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden" }, { status: 403 }));

  let token = "";
  let expiresAt = Number.NaN;
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token : "";
    expiresAt = typeof body?.expiresAt === "string" ? Date.parse(body.expiresAt) : Number.NaN;
  } catch {
    // invalid JSON: treated as a missing token below
  }

  if (!token || !(await isLiveSessionToken(token))) {
    const res = noStore(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    res.cookies.delete(SITE_SESSION_COOKIE);
    return res;
  }

  // The cookie lives no longer than the session itself (and at most 30 days).
  const remaining = Number.isFinite(expiresAt) ? Math.floor((expiresAt - Date.now()) / 1000) : MAX_AGE_SECONDS;
  const maxAge = Math.max(0, Math.min(remaining, MAX_AGE_SECONDS));

  const res = noStore(new NextResponse(null, { status: 204 }));
  res.cookies.set(SITE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  const res = noStore(new NextResponse(null, { status: 204 }));
  res.cookies.delete(SITE_SESSION_COOKIE);
  return res;
}
