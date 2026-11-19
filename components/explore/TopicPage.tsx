import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreCatalog from "./ExploreCatalog";
import { getCatalog, getExploreTaxonomy } from "@/lib/explore/api";
import { exploreMetadata } from "@/lib/explore/presentation";
import {
  findTopicTerm,
  isTopicPageIndexable,
  topicPageCopy,
  topicPagePath,
  topicQuery,
  type TopicKind,
} from "@/lib/explore/topicPages";

export type TopicPageProps = { params: Promise<{ locale: string; term: string }> };

async function resolveTopic(kind: TopicKind, slug: string) {
  const term = findTopicTerm(await getExploreTaxonomy(), kind, slug);
  const path = term && topicPagePath(term);
  return term && path ? { term, path, copy: topicPageCopy(term), query: topicQuery(term) } : null;
}

/**
 * A topic page is its own canonical. It is indexable only in English and only
 * once it lists `TOPIC_PAGE_MIN_LISTINGS` approved records; below that, and on
 * any catalog failure, it stays `noindex, follow`.
 */
export async function topicPageMetadata(kind: TopicKind, { params }: TopicPageProps): Promise<Metadata> {
  const { locale, term: slug } = await params;
  try {
    const topic = await resolveTopic(kind, slug);
    if (!topic) return { robots: { index: false, follow: true } };
    const meta = exploreMetadata(locale, topic.path, topic.copy.heading, topic.copy.intro, null);
    let listings = 0;
    try {
      listings = (await getCatalog(JSON.stringify(topic.query))).total;
    } catch {
      listings = 0;
    }
    if (!isTopicPageIndexable(listings)) meta.robots.index = false;
    return meta;
  } catch {
    return { robots: { index: false, follow: true } };
  }
}

export default async function TopicPage({ kind, params }: TopicPageProps & { kind: TopicKind }) {
  const { locale, term: slug } = await params;
  setRequestLocale(locale);
  const topic = await resolveTopic(kind, slug);
  if (!topic) notFound();
  return (
    <ExploreCatalog
      locale={locale}
      query={topic.query}
      topic={{ heading: topic.copy.heading, intro: topic.copy.intro, path: topic.path }}
    />
  );
}
