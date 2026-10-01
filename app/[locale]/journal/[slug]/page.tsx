import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPostCached, listPosts } from "@/lib/journal/api";
import {
  blogPostingSchema,
  postBreadcrumbSchema,
  postMetadata,
  postPath,
} from "@/lib/journal/presentation";
import type { JournalPostDetail, JournalPostEntry } from "@/lib/journal/types";
import { JournalArticle } from "@/components/journal/JournalArticle";
import { JsonLd } from "@/components/journal/JournalParts";

/**
 * A Journal post (contract §2, §7.2, §10). Rendered on the first request and
 * then served from the ISR cache; the data cache uses the same 600 s window
 * and the signed webhook expires both (tags `journal`, `journal:{slug}`) when
 * the post is published, updated or retired.
 *
 * - Retired with a successor: 308 to it. Retired without one, unknown or
 *   malformed: the not-found page (404, `noindex`). The contract prefers 410
 *   for retirements, but the App Router can only send 404 from a page, and a
 *   410 would need an API read in `proxy.ts` on every post request.
 * - Requested by id (`jnp_…`): 308 to the slug URL.
 * - API failure: the error propagates. During ISR revalidation that keeps
 *   the last good render; a cold miss is a 500, which crawlers retry, never
 *   a cached "missing" answer for a post that exists.
 */
export const revalidate = 600;
export const dynamicParams = true;
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== "en") return { robots: { index: false, follow: true } };
  try {
    const lookup = await getPostCached(slug);
    if (lookup.kind !== "post") return { robots: { index: false, follow: true } };
    return postMetadata(lookup.post);
  } catch {
    return { title: "Journal", robots: { index: false, follow: true } };
  }
}

/** Up to three other posts of the same type; the article never waits on a failure here. */
async function relatedPosts(post: JournalPostDetail): Promise<JournalPostEntry[]> {
  try {
    const { items } = await listPosts({ type: post.type, limit: 4 });
    return items.filter((item) => item.post_id !== post.post_id).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function JournalPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== "en") permanentRedirect(postPath(encodeURIComponent(slug)));
  setRequestLocale(locale);

  const lookup = await getPostCached(slug);
  if (lookup.kind === "gone") {
    if (lookup.redirectSlug) permanentRedirect(postPath(lookup.redirectSlug));
    notFound();
  }
  if (lookup.kind === "missing") notFound();
  const { post } = lookup;
  if (post.slug !== slug) permanentRedirect(postPath(post.slug));

  const related = await relatedPosts(post);
  return (
    <>
      <JsonLd value={blogPostingSchema(post)} />
      <JsonLd value={postBreadcrumbSchema(post)} />
      <JournalArticle post={post} related={related} />
    </>
  );
}
