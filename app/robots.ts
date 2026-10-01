import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: [
      "https://trytoone.com/sitemap.xml",
      // Explore items are API-driven and revalidate at runtime; see
      // app/sitemap-explore.xml/route.ts for why they are not in sitemap.xml.
      "https://trytoone.com/sitemap-explore.xml",
      // Journal posts are published through the API (Journal contract §10);
      // app/sitemap-journal.xml/route.ts builds this one at runtime too.
      "https://trytoone.com/sitemap-journal.xml",
    ],
  };
}
