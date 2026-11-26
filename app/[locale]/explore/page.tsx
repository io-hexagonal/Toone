import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ExploreCatalog, { exploreCatalogMetadata } from "@/components/explore/ExploreCatalog";
import { parseCatalogQuery } from "@/lib/explore/presentation";

/**
 * TE-01: the parameter-free hub. Like every Explore page it renders per
 * request (the section layout reads the request for the CSP script nonce),
 * but its Explore API reads come from the data cache (`revalidate` window),
 * which the signed webhook expires on approval. Filter, search and page URLs
 * are rewritten by `proxy.ts` to `./search`, which stays `noindex, follow`.
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
