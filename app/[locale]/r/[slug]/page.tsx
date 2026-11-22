import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import AffiliateLanding from "@/components/affiliates/AffiliateLanding";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const metadata: Metadata = {
  title: "Toone",
  robots: { index: false, follow: false },
};

/** A creator's vanity link (trytoone.com/r/{slug}); never indexed. */
export default async function AffiliateLink({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const messages = (await getMessages()) as Record<string, unknown>;
  return (
    <NextIntlClientProvider messages={{ affiliate: messages.affiliate } as never}>
      <AffiliateLanding slug={decodeURIComponent(slug).toLowerCase()} />
    </NextIntlClientProvider>
  );
}
