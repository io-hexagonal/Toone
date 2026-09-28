import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Link-preview crawlers that do not reliably follow the root locale redirect.
 * Serve these bots the English page at the root with complete preview metadata,
 * while preserving language negotiation for people and normal redirects for
 * search crawlers.
 */
const PREVIEW_BOTS =
  /LinkedInBot|facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterestbot|redditbot|SkypeUriPreview|vkShare/i;

const EXPLORE_HUB = /^\/([a-z]{2})\/explore\/?$/;
const CATALOG_PARAMS = ["type", "q", "tag", "category", "topic", "useful_for", "page"];

export default function proxy(req: NextRequest) {
  if (
    req.nextUrl.pathname === "/" &&
    PREVIEW_BOTS.test(req.headers.get("user-agent") ?? "")
  ) {
    return NextResponse.rewrite(new URL("/en", req.url));
  }

  // R6: the bare root is a permanent 308 to the default locale, never a 307.
  //
  // next-intl's middleware does negotiate a locale per request from
  // Accept-Language (`localeDetection` defaults to true), and it emits a
  // temporary 307 so that negotiation stays live. On `/` that costs more than
  // it buys:
  //
  //   1. `https://trytoone.com/` is the URL the web links to (827 referring
  //      domains, including the only genuine dofollow anchor). A 307 tells
  //      search engines the root is still a candidate URL of its own, so it
  //      competes with `/en` for the same canonical instead of consolidating
  //      into it. `/en` is already the declared `x-default` in both the HTML
  //      alternates and the sitemap, so the root has no separate identity to
  //      preserve.
  //   2. A permanent redirect is cached by the browser, which means *any*
  //      per-request logic at `/` — Accept-Language or cookie — stops running
  //      after the first visit. Negotiation at the root is therefore not
  //      something a permanent redirect degrades; it is something a permanent
  //      redirect makes honest.
  //   3. 308 (not 301) preserves the method and body, matching the 308 the
  //      www→apex rule in next.config.ts already issues, so the
  //      `www.`/`http://` chains terminate in a single permanent hop class.
  //
  // Accept-Language negotiation is kept for every *other* unprefixed path
  // (`/privacy`, `/downloads`, …), which are entered from inside the site and
  // are not link targets, so next-intl still owns those.
  if (req.nextUrl.pathname === "/") {
    const target = new URL(`/${routing.defaultLocale}`, req.url);
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  // F02: `/explore` is linked from outside the site, and only `/en/explore`
  // is indexable (the other locales canonicalise to it), so negotiation buys
  // nothing here either. Same permanent 308 as the root.
  if (req.nextUrl.pathname === "/explore") {
    const target = new URL(`/${routing.defaultLocale}/explore`, req.url);
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  // TE-01: the parameter-free hub is prerendered. Catalog parameters (type,
  // search, tag, taxonomy facets, page) need a per-request render, so those
  // URLs are rewritten to the request-time view; the address bar keeps them.
  // Anything else in the query (utm_*, ref) still gets the cached hub.
  const hub = req.nextUrl.pathname.match(EXPLORE_HUB);
  if (
    hub &&
    (routing.locales as readonly string[]).includes(hub[1]) &&
    CATALOG_PARAMS.some((key) => req.nextUrl.searchParams.has(key))
  ) {
    const target = req.nextUrl.clone();
    target.pathname = `/${hub[1]}/explore/search`;
    return NextResponse.rewrite(target);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|assets|.*\\..*).*)"],
};
