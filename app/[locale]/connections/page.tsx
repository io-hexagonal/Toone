import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import ConnectionsPage from "@/components/connect/ConnectionsPage";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";

/**
 * `/en/connections`: the apps connected to the account (Claude and others
 * allowed on /connect), with a way to disconnect each. The new-connection
 * email links here. English only, like /connect.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

export const metadata: Metadata = {
  title: "Connected apps",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Connections({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/connections", searchParams);
  setRequestLocale(locale);
  return <AccountMessages><ConnectionsPage /></AccountMessages>;
}
