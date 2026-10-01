import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  ...(process.env.NEXT_BUILD_DIR ? { distDir: process.env.NEXT_BUILD_DIR } : {}),
  // `next dev` only serves its client bundles to the origin it was started on;
  // opening http://127.0.0.1:<port> instead of localhost renders server HTML
  // without hydration, so nothing client-side (header morph, CTAs) runs.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
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
