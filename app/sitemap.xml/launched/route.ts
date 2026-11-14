import { siteSitemap } from "@/lib/site-sitemap";

/**
 * The sitemap from the launch on (lib/launch.ts). proxy.ts rewrites
 * `/sitemap.xml` here from the launch instant; static, like the main route,
 * so `lastmod` keeps its build-time git dates.
 */
export const dynamic = "force-static";

export async function GET() {
  return siteSitemap({ launched: true });
}
