import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Link-preview crawlers that don't reliably follow the root's 307 locale
 * redirect. LinkedIn is the worst offender: its scrape dead-ends on the
 * "Redirecting..." body, falls back to its own index for a title, and caches
 * an imageless card for ~7 days. Serve these bots the English page AT the
 * root — a 200 with the full OG/Twitter tags — and keep the accept-language
 * redirect for humans. Search engines are deliberately NOT in this list
 * (they follow redirects fine, and /en's canonical should stay the one URL
 * they index).
 */
const PREVIEW_BOTS =
  /LinkedInBot|facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Pinterestbot|redditbot|SkypeUriPreview|vkShare/i;

export default function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname === "/" &&
    PREVIEW_BOTS.test(req.headers.get("user-agent") ?? "")
  ) {
    return NextResponse.rewrite(new URL("/en", req.url));
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|assets|.*\\..*).*)"],
};
