import type { Metadata } from "next";
import type { Article, BreadcrumbList, WithContext } from "schema-dts";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticlePage from "@/components/ArticlePage";
import { getPublication } from "@/lib/content";
import { gitLastCommitDate } from "@/lib/source-date";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const publication = getPublication("ai-agent-governance");
  if (!publication) return {};
  const url = "https://trytoone.com/en/governance";
  // The frontmatter `updated:` is hand-maintained and drifted behind the
  // commit that rewrote this article (G2 follow-up 4). Git is the authority.
  const dateModified = gitLastCommitDate(publication.sourcePath) ?? publication.updated;
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
      modifiedTime: dateModified,
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
  const dateModified = gitLastCommitDate(publication.sourcePath) ?? publication.updated;

  const schema: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.title,
    description: publication.description,
    // Guide articles already carry an image; this one did not (audit P2-7).
    image: "https://trytoone.com/assets/og/toone-og.png",
    datePublished: publication.published,
    dateModified,
    mainEntityOfPage: "https://trytoone.com/en/governance",
    author: {
      "@type": "Organization",
      name: publication.author,
      url: "https://trytoone.com/en/editorial-policy",
    },
    publisher: { "@id": "https://trytoone.com/#organization" },
  };
  const breadcrumbSchema: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://trytoone.com/en" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resources",
        item: "https://trytoone.com/en/resources",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: publication.title,
        item: "https://trytoone.com/en/governance",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />
      <ArticlePage publication={publication} />
    </>
  );
}
