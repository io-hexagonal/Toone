import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AffiliatesAdminPage from "@/components/admin/AffiliatesAdminPage";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Affiliates({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AffiliatesAdminPage />;
}
