import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { NewcomerIdeaDetail } from "@/components/newcomers/NewcomerIdeaPage";
import { CREATOR_IDEAS, creatorIdea } from "@/lib/creator-ideas";
import { newcomerIdeaMetadata } from "@/lib/newcomer-ideas-seo";

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: PageSearchParams };

// English only: the other locales redirect (proxy.ts), so only /en is prerendered.
export function generateStaticParams() {
  return CREATOR_IDEAS.map((idea) => ({ locale: "en", slug: idea.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const idea = creatorIdea(slug);
  return idea ? newcomerIdeaMetadata(locale, idea) : { title: "Idea not found", robots: { index: false, follow: true } };
}

export default async function NewcomerIdeaRoute({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (locale !== "en") await redirectToEnglish(`/en/newcomers/ideas/${slug}`, searchParams);
  setRequestLocale(locale);
  const idea = creatorIdea(slug);
  if (!idea) notFound();
  return <NewcomerIdeaDetail idea={idea} />;
}
