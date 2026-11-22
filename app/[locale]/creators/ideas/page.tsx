import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CreatorIdeasIndex } from "@/components/affiliates/CreatorIdeaPage";

export const metadata: Metadata = {
  title: "Ideas to explore | Toone creators",
  robots: { index: false, follow: false },
};

export default async function CreatorIdeas({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreatorIdeasIndex />;
}
