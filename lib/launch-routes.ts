import { isLaunched } from "./launch";
import { accessAttribution } from "./explore/attribution";

/**
 * Where the funnel routes send a visitor, before and after the launch
 * (lib/launch.ts). proxy.ts answers with this on every request, so the
 * switch needs no deploy; the /download and /signup pages repeat it as a
 * fallback. Every answer is a temporary redirect: a browser must never keep
 * one across the launch.
 *
 *   before:  /download, /signup        -> /request-access (Explore attribution kept)
 *   after:   /download, signed in      -> /downloads
 *            /download, signed out     -> /signup?next=/downloads
 *            /request-access           -> /signup?next=/downloads
 *            /signup                   -> served (open sign-up)
 *
 * "Signed in" is the site-session cookie (lib/site-session.ts), which every
 * saved session sets. A visitor whose browser holds a session without the
 * cookie lands on /signup, which forwards a signed-in visitor to `next`.
 */

export const DOWNLOADS_PATH = "/downloads";

const FUNNEL = /^\/([a-z]{2})\/(download|signup|request-access)\/?$/;

export type LaunchRedirect = { location: string; varyOnCookie: boolean };

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  ).toString();
  return query ? `${path}?${query}` : path;
}

/** The sign-up URL that returns a new account to the downloads grid. */
export function signupForDownloadHref(locale: string, attribution: { from?: string; item?: string } = {}): string {
  return withQuery(`/${locale}/signup`, { next: DOWNLOADS_PATH, ...attribution });
}

/**
 * The redirect for a locale-prefixed funnel path, or null when the request is
 * served as is (or is not a funnel path). `locale` is not validated here; the
 * caller only passes supported locales.
 */
export function launchRedirect(
  pathname: string,
  search: URLSearchParams,
  { now = Date.now(), signedIn = false }: { now?: number; signedIn?: boolean } = {},
): LaunchRedirect | null {
  const match = pathname.match(FUNNEL);
  if (!match) return null;
  const [, locale, page] = match;
  const attribution = accessAttribution(search.get("from"), search.get("item"));

  if (!isLaunched(now)) {
    if (page === "request-access") return null;
    // Older Explore links use /download?from=explore; /signup never carried a query.
    return {
      location: withQuery(`/${locale}/request-access`, page === "download" ? attribution : {}),
      varyOnCookie: false,
    };
  }

  if (page === "signup") return null;
  if (page === "download" && signedIn) {
    return { location: withQuery(`/${locale}${DOWNLOADS_PATH}`, attribution), varyOnCookie: true };
  }
  return { location: signupForDownloadHref(locale, attribution), varyOnCookie: page === "download" };
}
