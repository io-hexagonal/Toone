import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ExploreCatalog, { exploreCatalogMetadata } from "@/components/explore/ExploreCatalog";
import { parseCatalogQuery } from "@/lib/explore/presentation";

/**
 * TE-01: the parameter-free hub is prerendered and served from cache. The data
 * cache window matches, and the signed webhook expires both on approval.
 * Filter, search and page URLs are rewritten by `proxy.ts` to
 * `./search`, which renders per request and stays `noindex, follow`.
 */
export const revalidate = 600;

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return exploreCatalogMetadata(locale, parseCatalogQuery({}));
}
export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExploreCatalog locale={locale} query={parseCatalogQuery({})} />;
}
