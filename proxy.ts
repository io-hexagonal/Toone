import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { ENGLISH_ONLY_PATHS, LOCALE_CHOICE_COOKIE, routing, type Locale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Link-preview crawlers that do not reliably follow the root locale redirect.
 * Serve these bots the English page at the root with complete preview metadata,
 * while preserving language negotiation for people and normal redirects for
 * search crawlers.
 */
const PREVIEW_BOTS =
  /LinkedInBot|facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterestbot|redditbot|SkypeUriPreview|vkShare/i;

/** Unprefixed URLs the web links to, each a permanent 308 to its `/en` copy. */
const LINK_TARGETS = new Set(["/", "/explore"]);
const EXPLORE_HUB = /^\/([a-z]{2})\/explore\/?$/;
/**
 * English-only routes (i18n/routing.ts), unprefixed or under a two-letter
 * prefix: `[, prefix?, route, rest?]`. The routes are plain `/a-z-` paths.
 */
const ENGLISH_ONLY = new RegExp(`^(?:/([a-z]{2}))?(${ENGLISH_ONLY_PATHS.join("|")})(/.*)?$`);
/** Unprefixed paths of the retired AI digest. */
const AI_DIGEST_PATH = /^\/ai-digest(\/.*)?$/;
const JOURNAL_PREVIEW = /^\/en\/journal\/preview\//;
const CATALOG_PARAMS = ["type", "q", "tag", "category", "topic", "useful_for", "page"];

function isLocale(value: string | undefined): value is Locale {
  return value != null && (routing.locales as readonly string[]).includes(value);
}

/** The visitor's explicit language choice, when it names a supported locale. */
function localeChoice(req: NextRequest): Locale | null {
  const value = req.cookies.get(LOCALE_CHOICE_COOKIE)?.value;
  return isLocale(value) ? value : null;
}

/** Redirect to `pathname` on this origin, keeping the query string. */
function redirect(req: NextRequest, pathname: string, status: 307 | 308) {
  const target = new URL(pathname, req.url);
  target.search = req.nextUrl.search;
  return NextResponse.redirect(target, status);
}

/**
 * A redirect that depends on the request's cookie (or language) must never be
 * stored: not by the browser, which would replay it after the visitor chose
 * another language, and not by a shared cache, which would hand it to others.
 */
function perVisitor(response: NextResponse, vary: string) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", vary);
  return response;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/" && PREVIEW_BOTS.test(req.headers.get("user-agent") ?? "")) {
    return NextResponse.rewrite(new URL("/en", req.url));
  }

  // R6: the bare root is a permanent 308 to the default locale, never
  // next-intl's negotiated 307.
  //
  //   1. `https://trytoone.com/` is the URL the web links to (827 referring
  //      domains, including the only genuine dofollow anchor). A 307 tells
  //      search engines the root is still a candidate URL of its own, so it
  //      competes with `/en` for the same canonical instead of consolidating
  //      into it. `/en` is already the declared `x-default` in both the HTML
  //      alternates and the sitemap, so the root has no separate identity to
  //      preserve.
  //   2. Nothing here branches on Accept-Language, user agent (beyond the
  //      preview-bot rewrite above) or IP. The only input is the visitor's
  //      explicit choice in the `toone_locale` cookie, which only the
  //      language links and the suggestion's "View in …" button write: a
  //      supported non-English choice gets a 307 to that locale. Crawlers
  //      never carry the cookie, so they always see the permanent 308. Both
  //      answers are `private, no-store`, so a browser never keeps the 308
  //      and a choice made later is always honoured.
  //   3. 308 (not 301) preserves the method and body, matching the 308 the
  //      www→apex rule in next.config.ts already issues, so the
  //      `www.`/`http://` chains terminate in a single permanent hop class.
  //
  // F02: `/explore` is linked from outside the site too, and only
  // `/en/explore` is indexable, so it follows the same rule.
  if (LINK_TARGETS.has(pathname)) {
    const suffix = pathname === "/" ? "" : pathname;
    const choice = localeChoice(req);
    return perVisitor(
      choice && choice !== routing.defaultLocale
        ? redirect(req, `/${choice}${suffix}`, 307)
        : redirect(req, `/${routing.defaultLocale}${suffix}`, 308),
      "Cookie",
    );
  }

  // English-only routes (About, Contact, Editorial policy, Governance,
  // How-to, the Journal, Privacy, Terms): the unprefixed path and every other
  // locale's copy are one permanent 308 to the `/en` URL, query kept, whatever
  // the language or cookie. next-intl's 307 used to send `Accept-Language: pt`
  // visitors through `/pt/privacy` before the page's own 308, and that second
  // hop dropped the query (TECH-020; Journal contract §10 for the Journal, so
  // no non-English Journal page is ever rendered, cached or crawled). The
  // pages keep a fallback redirect (lib/english-only.ts). `/journal/feed.xml`
  // and `/journal/og/*.png` contain a dot, so the matcher below never sends
  // them through this function.
  const englishOnly = pathname.match(ENGLISH_ONLY);
  if (englishOnly) {
    const [, prefix, route, rest = ""] = englishOnly;
    if (prefix === undefined || (isLocale(prefix) && prefix !== routing.defaultLocale)) {
      return redirect(req, `/${routing.defaultLocale}${route}${rest}`, 308);
    }
  }

  // TECH-024: the retired `/ai-digest/*` tree answers 410 at every URL. The
  // unprefixed paths used to 307 into `/en/ai-digest…` first; serve the 410
  // route directly so Google sees Gone on the URL it requested.
  const aiDigest = pathname.match(AI_DIGEST_PATH);
  if (aiDigest) {
    const target = req.nextUrl.clone();
    target.pathname = `/${routing.defaultLocale}/ai-digest${aiDigest[1] ?? ""}`;
    return NextResponse.rewrite(target);
  }

  // Other unprefixed paths (`/downloads`, `/request-access?…`): an explicit
  // choice wins with a 307 to that locale; without one, next-intl negotiates
  // Accept-Language and falls back to English. Either answer depends on the
  // request, so neither is stored. Locale-prefixed URLs are never redirected
  // by preference: the language in the URL is the one served.
  if (!isLocale(pathname.split("/")[1])) {
    const choice = localeChoice(req);
    if (choice) {
      return perVisitor(redirect(req, `/${choice}${pathname}`, 307), "Cookie, Accept-Language");
    }
    const response = intlMiddleware(req);
    return response.headers.has("location")
      ? perVisitor(response, "Cookie, Accept-Language")
      : response;
  }

  // Draft previews are unlisted, `noindex` and never cached (§2, §3). The page
  // is rendered per request; these headers also cover crawlers that only read
  // response headers and any shared cache between the user and the origin.
  if (JOURNAL_PREVIEW.test(pathname)) {
    const response = intlMiddleware(req);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  // TE-01: the parameter-free hub is prerendered. Catalog parameters (type,
  // search, tag, taxonomy facets, page) need a per-request render, so those
  // URLs are rewritten to the request-time view; the address bar keeps them.
  // Anything else in the query (utm_*, ref) still gets the cached hub.
  const hub = pathname.match(EXPLORE_HUB);
  if (hub && isLocale(hub[1]) && CATALOG_PARAMS.some((key) => req.nextUrl.searchParams.has(key))) {
    const target = req.nextUrl.clone();
    target.pathname = `/${hub[1]}/explore/search`;
    return NextResponse.rewrite(target);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|assets|.*\\..*).*)"],
};
