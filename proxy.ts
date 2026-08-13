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

export default function proxy(req: NextRequest) {
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
