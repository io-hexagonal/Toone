import type { Metadata } from "next";
import type { Article, BreadcrumbList, WithContext } from "schema-dts";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticlePage from "@/components/ArticlePage";
import { getPublication, getPublications } from "@/lib/content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublications()
    .filter((publication) => publication.canonicalPath.startsWith("/guides/"))
    .map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const publication = getPublication(slug);
  if (!publication) return {};
  const url = `https://trytoone.com/en${publication.canonicalPath}`;

  return {
    title: publication.title,
    description: publication.description,
    alternates: {
      canonical: url,
      languages: { en: url, "x-default": url },
    },
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
      images: [
        {
          url: "https://trytoone.com/assets/guides/ai-native-company-diagnostic.png",
          width: 1200,
          height: 630,
          alt: "Five checks in the Toone AI-native operating-model diagnostic",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: publication.title,
      description: publication.description,
      images: ["https://trytoone.com/assets/guides/ai-native-company-diagnostic.png"],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  const publication = getPublication(slug);
  if (!publication || !publication.canonicalPath.startsWith("/guides/")) notFound();
  if (locale !== "en") permanentRedirect(`/en${publication.canonicalPath}`);
  setRequestLocale(locale);

  const url = `https://trytoone.com/en${publication.canonicalPath}`;
  const articleSchema: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.title,
    description: publication.description,
    datePublished: publication.published,
    dateModified: publication.updated,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Toone", url: "https://trytoone.com/en/about" },
    publisher: { "@id": "https://trytoone.com/#organization" },
    image: "https://trytoone.com/assets/guides/ai-native-company-diagnostic.png",
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
      { "@type": "ListItem", position: 3, name: publication.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
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
