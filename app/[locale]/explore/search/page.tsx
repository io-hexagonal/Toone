import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ExploreCatalog, { exploreCatalogMetadata } from "@/components/explore/ExploreCatalog";
import { parseCatalogQuery } from "@/lib/explore/presentation";

/**
 * Request-time view of `/[locale]/explore?…` (type, search, tag, taxonomy
 * facets, page). `proxy.ts` rewrites those URLs here, so the public URL keeps
 * its query string and the canonical stays `/en/explore`. Never indexable
 * (TECH-007), including a direct visit to this path.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await exploreCatalogMetadata(locale, parseCatalogQuery(await searchParams));
  meta.robots.index = false;
  return meta;
}
export default async function ExploreSearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExploreCatalog locale={locale} query={parseCatalogQuery(await searchParams)} />;
}
