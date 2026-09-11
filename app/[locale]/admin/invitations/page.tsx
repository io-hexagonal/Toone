import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import InvitationAdminPage from "@/components/InvitationAdminPage";

export const metadata: Metadata = {
  title: "Invitations",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Invitations({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InvitationAdminPage />;
}
