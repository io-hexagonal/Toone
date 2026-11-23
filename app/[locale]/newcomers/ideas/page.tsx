import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { NewcomerIdeasIndex } from "@/components/newcomers/NewcomerIdeaPage";
import { newcomerIndexMetadata } from "@/lib/newcomer-ideas-seo";

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return newcomerIndexMetadata(locale);
}

export default async function NewcomerIdeas({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/newcomers/ideas", searchParams);
  setRequestLocale(locale);
  return <NewcomerIdeasIndex />;
}
