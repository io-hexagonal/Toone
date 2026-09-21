import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // `next dev` only serves its client bundles to the origin it was started on;
  // opening http://127.0.0.1:<port> instead of localhost renders server HTML
  // without hydration, so nothing client-side (header morph, CTAs) runs.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.trytoone.com" }],
        destination: "https://trytoone.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
