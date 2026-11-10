import type { Metadata } from "next";
import { redirect } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** The invitations admin became the codes admin; old bookmarks land there. */
export default async function Invitations({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/admin/codes", locale });
}
