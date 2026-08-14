import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type Props = { params: Promise<{ locale: string }> };

export default async function GuidesIndex({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/resources`);
}
