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
      {
        source: "/how-to/features/workflow-library",
        destination: "/en/how-to/features/explore",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
