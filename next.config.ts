import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { VERCEL_APP_HOST_PATTERN } from "./lib/vercel-host";
import { PERMISSIONS_POLICY } from "./lib/csp";
import { collectSourceDates } from "./lib/source-date";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Release gate (lib/legal/release.ts): inlined so the server and browser
  // bundles of a production build agree on whether checkout may be offered.
  env: {
    TOONE_RELEASE_BUILD: process.env.VERCEL_ENV === "production" || process.env.LEGAL_RELEASE_CHECK === "1" ? "1" : "0",
    // Last-commit dates of the content files (lib/source-date.ts). Pages
    // render per request for the CSP nonce, and the runtime has no git, so
    // the dates are taken here, at build time, where git history exists.
    TOONE_SOURCE_DATES: JSON.stringify(collectSourceDates("content")),
  },
  // Pages read content/ at request time (lib/content.ts,
  // lib/product-showcase.ts); ship it with every server function.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  ...(process.env.NEXT_BUILD_DIR ? { distDir: process.env.NEXT_BUILD_DIR } : {}),
  // `next dev` only serves its client bundles to the origin it was started on;
  // opening http://127.0.0.1:<port> instead of localhost renders server HTML
  // without hydration, so nothing client-side (header morph, CTAs) runs.
  allowedDevOrigins: ["127.0.0.1"],
  // No `X-Powered-By: Next.js` (framework fingerprinting).
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  // Bing reads a page's language from Content-Language. Only locale-prefixed
  // paths match (`:path*` includes the bare `/en`); `/api`, `/_next`,
  // `/assets` and the root files never start with a locale.
  async headers() {
    return [
      // Baseline for every route. It comes FIRST: when two rules set the same
      // key, the last match wins, so the per-route `Referrer-Policy:
      // no-referrer` rules below (and proxy.ts, which runs after these
      // headers) keep the stricter value. No page is meant to be framed by
      // another site (no embed or oEmbed routes; OG images are fetched, not
      // framed), so framing is same-origin only. This CSP carries
      // `frame-ancestors` only: it covers routes outside the proxy (API
      // routes, feeds, OG images, static files). Pages get the full policy
      // with a per-request script nonce from proxy.ts (lib/csp.ts).
      //
      // HSTS has no `preload` on purpose: preloading is hard to undo and
      // needs every subdomain on HTTPS first. COOP allows popups because
      // Google and Apple sign-in open one and must keep talking to this page.
      // Permissions-Policy turns off powerful features the site never uses;
      // FedCM (`identity-credentials-get`) stays allowed for Google sign-in.
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
        ],
      },
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/:path*",
        headers: [{ key: "Content-Language", value: ":locale" }],
      },
      // TECH-021: English is the only indexed locale. Every page outside it
      // already ships `<meta name="robots" content="noindex, follow">`
      // (i18n/indexing.ts); this header holds the line for any route whose
      // own `robots` metadata forgets it. Keep the list in step with
      // INDEXED_LOCALES.
      {
        source: "/:locale(pt|es|fr|de|it|nl|ru)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      // Account-like pages carry checkout session IDs, codes or account
      // state; no request from them (same-origin assets included) sends the
      // page URL as Referer. The pages' own `referrer` metadata arrives after
      // the stylesheet links, so the header is what actually holds.
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/:page(success|cancel|account|connections|redeem|cancel-contract|unsubscribe|admin)/:rest*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/:page(success|cancel)",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      // The consent page an assistant sends the person to while connecting
      // their account: no site may frame it, its own included (a framed
      // consent page can be clickjacked). proxy.ts adds no-store.
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)?/connect",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      // Duplicate Vercel hosts (toone-landing*.vercel.app) stay out of the
      // index; trytoone.com is the only indexable host (lib/vercel-host.ts).
      // robots.txt stays open there so crawlers can read this header.
      {
        source: "/:path*",
        has: [{ type: "host", value: VERCEL_APP_HOST_PATTERN }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  async redirects() {
    return [
      // F03: `www` URLs whose apex target is itself a redirect (proxy.ts sends
      // `/` and `/explore` to `/en/…` with a 308) go straight to the final
      // URL, so `https://www…/` is one hop instead of two.
      {
        source: "/",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en",
        permanent: true,
      },
      {
        source: "/explore",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/explore",
        permanent: true,
      },
      // Same for the Journal (contract §2, §10): `/changelog` (any locale) and
      // the unprefixed or non-English Journal URLs are themselves redirects
      // on the apex (the `/changelog` rules below, proxy.ts for `/journal`),
      // so `www` goes straight to the final `/en/journal…` URL. Paths with a
      // dot (`/journal/feed.xml`, `/journal/og/*.png`) are files served
      // unprefixed and fall through to the generic rule. These must stay
      // above that rule: the first match wins.
      {
        source: "/changelog",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/journal/releases",
        permanent: true,
      },
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/changelog",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/journal/releases",
        permanent: true,
      },
      {
        source: "/:locale(pt|es|fr|de|it|nl|ru)?/journal",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/journal",
        permanent: true,
      },
      {
        source: "/:locale(pt|es|fr|de|it|nl|ru)?/journal/:rest([^.]+)",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/journal/:rest",
        permanent: true,
      },
      // Unprefixed How-to paths are a 308 on the apex too (proxy.ts).
      // Two rules: an empty `:rest*` leaves a trailing slash on Vercel, which
      // is one more 308 (`/en/how-to/` to `/en/how-to`).
      {
        source: "/how-to",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/how-to",
        permanent: true,
      },
      {
        source: "/how-to/:rest+",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/en/how-to/:rest+",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/:path*",
        permanent: true,
      },
      // Indexing plan A4 (2026-11-26): four thin concept pages (130-196 words,
      // never indexed, no external links) merged into the long guides that
      // own the same job. Every locale lands on the English page in one hop.
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)?/guides/:slug(ai-agent-adoption-roadmap|ai-native-company)",
        destination: "/en/ai-agent-routines",
        permanent: true,
      },
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)?/guides/how-agent-operations-work",
        destination: "/en/guides/choosing-ai-agent-organization-templates",
        permanent: true,
      },
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)?/organizational-knowledge",
        destination: "/en/guides/choosing-ai-agent-organization-templates",
        permanent: true,
      },
      // Workflow library was merged into the Explore guide. How-to is
      // English-only, so every locale prefix and the bare path land on /en.
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/how-to/features/workflow-library",
        destination: "/en/how-to/features/explore",
        permanent: true,
      },
      // BC-09 (owner decision 2026-09-28): Showcases is retired and Explore
      // replaces it. Every locale copy lands on the English Explore hub.
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/business/showcases",
        destination: "/en/explore",
        permanent: true,
      },
      {
        source: "/business/showcases",
        destination: "/en/explore",
        permanent: true,
      },
      // Journal contract §2: the changelog lives in the Journal's releases hub.
      {
        source: "/changelog",
        destination: "/en/journal/releases",
        permanent: true,
      },
      {
        source: "/:locale(en|pt|es|fr|de|it|nl|ru)/changelog",
        destination: "/en/journal/releases",
        permanent: true,
      },
      {
        source: "/how-to/features/workflow-library",
        destination: "/en/how-to/features/explore",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
