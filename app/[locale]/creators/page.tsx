import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import CreatorDashboard from "@/components/affiliates/CreatorDashboard";

export const metadata: Metadata = {
  title: "Creator dashboard",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Creators({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreatorDashboard />;
}
