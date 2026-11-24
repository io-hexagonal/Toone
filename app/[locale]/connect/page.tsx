import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import ConnectPage from "@/components/connect/ConnectPage";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { parseRequestId } from "@/lib/connect/consent";

/**
 * The consent page an assistant (Claude) sends the person to while
 * connecting their Toone account: `/en/connect?request=car_…`. English only,
 * like the privacy policy it links to. Reading the query makes it a
 * per-request page; proxy.ts adds `no-store` and next.config.ts forbids
 * framing.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

export const metadata: Metadata = {
  title: "Connect to Toone",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Connect({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/connect", searchParams);
  setRequestLocale(locale);
  const requestId = parseRequestId((await searchParams).request);
  return <AccountMessages><ConnectPage requestId={requestId} /></AccountMessages>;
}
