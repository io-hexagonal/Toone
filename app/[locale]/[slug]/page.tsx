import type { Metadata } from "next";
import type { Article, BreadcrumbList, WithContext } from "schema-dts";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ArticlePage, { type ArticleUi } from "@/components/ArticlePage";
import {
  getPublication,
  getPublicationLocales,
  getRootEditorialSlugs,
  isRootEditorialPublication,
  publicationAlternates,
  publicationUrl,
} from "@/lib/content";
import type { Locale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getRootEditorialSlugs().map((slug) => ({ slug }));
}

function absoluteUrl(value: string): string {
  return new URL(value, "https://trytoone.com").toString();
}

async function articleUi(locale: Locale): Promise<ArticleUi> {
  const t = await getTranslations({ locale, namespace: "article" });
  return {
    breadcrumb: t("breadcrumb"),
    home: t("home"),
    resources: t("resources"),
    by: t("by"),
    published: t("published"),
    updated: t("updated"),
    onThisPage: t("onThisPage"),
    continueTitle: t("continueTitle"),
    continueDescription: t("continueDescription"),
    continueAction: t("continueAction"),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const localized = getPublication(slug, locale);
  const english = getPublication(slug, "en");
  const publication = localized && isRootEditorialPublication(localized) ? localized : null;
  const englishPublication = english && isRootEditorialPublication(english) ? english : null;
  if (!publication && !englishPublication) return {};

  const resolvedPublication = publication ?? englishPublication!;
  const url = publicationUrl(resolvedPublication, publication ? locale : "en");
  const alternateLocales = getPublicationLocales(slug);

  return {
    title: resolvedPublication.title,
    description: resolvedPublication.description,
    alternates: {
      canonical: url,
      languages: publication
        ? publicationAlternates(slug, resolvedPublication.canonicalPath)
        : {
            en: publicationUrl(resolvedPublication, "en"),
            "x-default": publicationUrl(resolvedPublication, "en"),
          },
    },
    robots: publication ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      url,
      title: resolvedPublication.title,
      description: resolvedPublication.description,
      siteName: "Toone",
      locale,
      alternateLocale: alternateLocales.filter((alternate) => alternate !== locale),
      publishedTime: resolvedPublication.published,
      modifiedTime: resolvedPublication.updated,
      authors: [resolvedPublication.author],
      images: [{ url: absoluteUrl(resolvedPublication.image), alt: resolvedPublication.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedPublication.title,
      description: resolvedPublication.description,
      images: [{ url: absoluteUrl(resolvedPublication.image), alt: resolvedPublication.imageAlt }],
    },
  };
}

export default async function RootEditorialPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const localized = getPublication(slug, locale);
  const english = getPublication(slug, "en");
  const publication = localized && isRootEditorialPublication(localized) ? localized : null;
  const englishPublication = english && isRootEditorialPublication(english) ? english : null;
  if (!publication) {
    if (englishPublication) permanentRedirect(`/en${englishPublication.canonicalPath}`);
    notFound();
  }
  setRequestLocale(locale);

  const ui = await articleUi(locale);
  const url = publicationUrl(publication, locale);
  const articleSchema: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.heading,
    description: publication.description,
    inLanguage: locale,
    datePublished: publication.published,
    dateModified: publication.updated,
    mainEntityOfPage: url,
    author: {
      "@type": publication.authorType,
      name: publication.author,
      url: absoluteUrl(publication.authorUrl),
    },
    publisher: { "@id": "https://trytoone.com/#organization" },
    image: absoluteUrl(publication.image),
  };
  const breadcrumbSchema: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui.home, item: `https://trytoone.com/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: ui.resources,
        item: `https://trytoone.com/${locale}/resources`,
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
      <ArticlePage publication={publication} locale={locale} ui={ui} />
    </>
  );
}
