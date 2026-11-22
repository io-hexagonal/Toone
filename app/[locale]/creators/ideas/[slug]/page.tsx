import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CreatorIdeaDetail } from "@/components/affiliates/CreatorIdeaPage";
import { CREATOR_IDEAS, creatorIdea } from "@/lib/creator-ideas";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => CREATOR_IDEAS.map((idea) => ({ locale, slug: idea.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const idea = creatorIdea(slug);
  return {
    title: idea ? `${idea.title} | Toone creators` : "Toone creators",
    description: idea?.summary,
    robots: { index: false, follow: false },
  };
}

export default async function CreatorIdeaRoute({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idea = creatorIdea(slug);
  if (!idea) notFound();
  return <CreatorIdeaDetail idea={idea} />;
}
