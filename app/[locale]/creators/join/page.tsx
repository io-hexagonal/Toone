import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import CreatorJoinPage from "@/components/affiliates/CreatorJoinPage";

export const metadata: Metadata = {
  title: "Join Toone as a creator",
  robots: { index: false, follow: false },
  // The creator code travels in the fragment, which is never sent; no referrer either.
  referrer: "no-referrer",
};

export default async function CreatorJoin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountMessages><CreatorJoinPage /></AccountMessages>;
}
