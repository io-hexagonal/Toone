import type { Metadata } from "next";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-versions";
import { loadSeller } from "@/lib/legal/current-seller";
import TermsDocument, { termsMetadata } from "./TermsDocument";

/** The seller model comes from the API (cached like the pricing page), so a switch needs no redeploy. */
export const revalidate = 300;

/**
 * The current Terms. `/en/terms?version=<date>` is rewritten by proxy.ts to
 * ./versioned, so this page never reads the query and stays static.
 */
type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return termsMetadata(locale);
}

export default async function TermsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/terms", searchParams);
  setRequestLocale(locale);
  const seller = await loadSeller();

  return <TermsDocument view={{ kind: "current", version: CURRENT_TERMS_VERSION }} seller={seller} />;
}
