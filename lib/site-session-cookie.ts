/**
 * Name of the httpOnly cookie that mirrors a signed-in browser session
 * (lib/site-session.ts). Kept dependency-free so proxy.ts can read it.
 */
export const SITE_SESSION_COOKIE = "toone_site_session";
