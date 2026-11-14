import { isLaunched } from "@/lib/launch";
import { siteSitemap } from "@/lib/site-sitemap";

/**
 * `/sitemap.xml`, built on the build host so `lastmod` keeps its git dates.
 * Its list is the launch state at build time; from the launch on, proxy.ts
 * serves `/sitemap.xml/launched` at this URL instead, so a deployment built
 * before the launch still lists the public funnel from the launch instant.
 */
export const dynamic = "force-static";

export async function GET() {
  return siteSitemap({ launched: isLaunched() });
}
