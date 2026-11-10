import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import CodesAdminPage from "@/components/admin/CodesAdminPage";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Codes({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CodesAdminPage />;
}
