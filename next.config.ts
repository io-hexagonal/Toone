import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
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
