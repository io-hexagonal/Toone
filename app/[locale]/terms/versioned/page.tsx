import type { Metadata } from "next";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import { TERMS_VERSION_PARAM, resolveTermsVersion } from "@/lib/legal/terms-versions";
import { loadSeller } from "@/lib/legal/current-seller";
import TermsDocument, { termsMetadata } from "../TermsDocument";

/**
 * Request-time view of `/en/terms?version=<YYYY-MM-DD>`, the address a
 * purchase confirmation links to. proxy.ts rewrites those URLs here, so the
 * address bar keeps the query. It shows the version in force on that day,
 * or the current one with a note when no version covers it. The canonical
 * stays `/en/terms` and this view is never indexed, including a direct visit
 * to this path.
 */
type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return termsMetadata(locale, true);
}

export default async function VersionedTermsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/terms", searchParams);
  setRequestLocale(locale);
  const view = resolveTermsVersion((await searchParams)[TERMS_VERSION_PARAM]);
  const seller = await loadSeller();

  return <TermsDocument view={view} seller={seller} />;
}
