import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ExploreCatalog from "./ExploreCatalog";
import { getExploreTaxonomy, topicListings } from "@/lib/explore/api";
import { exploreMetadata } from "@/lib/explore/presentation";
import { exploreOutage } from "@/lib/explore/outage";
import {
  findTopicTerm,
  isTopicPageIndexable,
  topicPageCopy,
  topicPageIntro,
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
 * once it meets TOPIC-012 (a written intro and `TOPIC_PAGE_MIN_LISTINGS`
 * distinct records, counted as routines); below that it stays
 * `noindex, follow`. A catalog outage is a server error (A8).
 */
export async function topicPageMetadata(kind: TopicKind, { params }: TopicPageProps): Promise<Metadata> {
  const { locale, term: slug } = await params;
  try {
    const topic = await resolveTopic(kind, slug);
    if (!topic) return { robots: { index: false, follow: true } };
    const meta = exploreMetadata(locale, topic.path, topic.copy.heading, topic.copy.intro, null);
    // No written intro: never indexable, so skip the routine count (one less
    // API call, and one less way for the page to fail).
    if (topicPageIntro(topic.term.id) === null) {
      meta.robots.index = false;
      return meta;
    }
    const listings = await topicListings(topic.term.id);
    if (!isTopicPageIndexable(topic.term.id, listings)) meta.robots.index = false;
    return meta;
  } catch (error) {
    // An outage is a server error that crawlers retry, never `noindex` (A8).
    exploreOutage("topic metadata", error);
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
