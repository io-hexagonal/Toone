import type { Metadata } from "next";
import type { Article, WithContext } from "schema-dts";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticlePage from "@/components/ArticlePage";
import { getPublication } from "@/lib/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const publication = getPublication("ai-agent-governance");
  if (!publication) return {};
  const url = "https://trytoone.com/en/governance";
  return {
    title: publication.title,
    description: publication.description,
    alternates: { canonical: url, languages: { en: url, "x-default": url } },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      url,
      title: publication.title,
      description: publication.description,
      siteName: "Toone",
      publishedTime: publication.published,
      modifiedTime: publication.updated,
      authors: [publication.author],
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function GovernancePage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/governance");
  setRequestLocale(locale);
  const publication = getPublication("ai-agent-governance");
  if (!publication) notFound();

  const schema: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.title,
    description: publication.description,
    datePublished: publication.published,
    dateModified: publication.updated,
    mainEntityOfPage: "https://trytoone.com/en/governance",
    author: { "@type": "Organization", name: "Toone", url: "https://trytoone.com/en/about" },
    publisher: { "@id": "https://trytoone.com/#organization" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <ArticlePage publication={publication} />
    </>
  );
}
