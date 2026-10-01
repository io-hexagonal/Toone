import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPreviewCached } from "@/lib/journal/api";
import { previewMetadata } from "@/lib/journal/presentation";
import { JournalArticle } from "@/components/journal/JournalArticle";

/**
 * Draft preview (contract §2, §3, §7.1): the revision that owns the token,
 * rendered exactly like the post with a "Preview — not published" banner.
 * Never cached (the API read is `no-store` and the route is dynamic; proxy.ts
 * adds `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`), never
 * indexed, no canonical, no structured data. Unknown or expired tokens 404.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const robots = { index: false, follow: false, nocache: true };
  try {
    const post = await getPreviewCached(token);
    return post ? previewMetadata(post) : { title: "Preview", robots };
  } catch {
    return { title: "Preview", robots };
  }
}

export default async function JournalPreviewPage({ params }: Props) {
  const { locale, token } = await params;
  if (locale !== "en") permanentRedirect(`/en/journal/preview/${encodeURIComponent(token)}`);
  setRequestLocale(locale);
  const post = await getPreviewCached(token);
  if (!post) notFound();
  return <JournalArticle post={post} preview={{ state: post.state }} />;
}
