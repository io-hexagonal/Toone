import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import CoverImage from "@/components/explore/CoverImage";
import { resolveAssetUrl } from "@/lib/journal/data";
import {
  JOURNAL_FEED_URL,
  formatPostDate,
  hubForType,
  postEyebrow,
  postPath,
  readTimeLabel,
} from "@/lib/journal/presentation";
import type { JournalPostEntry, JournalPostType } from "@/lib/journal/types";
import "./journal.css";

/** Escaped JSON-LD (`<` cannot close the script element). */
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, "\\u003c") }}
    />
  );
}

export function JournalShell({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  return (
    <div className="jr-shell">
      {banner}
      <SiteHeader scrollThreshold={160} />
      {children}
      <Footer />
    </div>
  );
}

/**
 * A post's cover, or the branded placeholder (type-tinted, with the version
 * for releases) when it has none. The placeholder sits beneath the image, so
 * a cover that fails to load still leaves a finished tile.
 */
export function JournalCover({
  post,
  decorative = true,
}: {
  post: Pick<JournalPostEntry, "type" | "cover" | "release">;
  decorative?: boolean;
}) {
  const url = post.cover ? resolveAssetUrl(post.cover.url) : null;
  const hub = hubForType(post.type);
  const word = post.type === "release" && post.release ? post.release.version : hub.label;
  return (
    <span className="jr-cover" data-type={post.type} aria-hidden={decorative ? "true" : undefined}>
      <span className="jr-cover-placeholder">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="jr-cover-mark" src="/assets/brand/toone-mark.svg" alt="" width={28} height={28} />
        <span className="jr-cover-word">
          <small>Toone Journal</small>
          {word}
        </span>
      </span>
      {url && <CoverImage className="jr-cover-img" src={url} alt={decorative ? "" : post.cover?.alt} />}
    </span>
  );
}

export function TypeEyebrow({ post }: { post: Pick<JournalPostEntry, "type" | "release"> }) {
  return (
    <span className="jr-card-eyebrow" data-type={post.type as JournalPostType}>
      {postEyebrow(post)}
    </span>
  );
}

export function PostCard({
  post,
  lead = false,
  headingLevel = 2,
}: {
  post: JournalPostEntry;
  lead?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className={`jr-card${lead ? " jr-card--lead" : ""}`}>
      <a className="jr-card-link" href={postPath(post.slug)}>
        <JournalCover post={post} />
        <span className="jr-card-copy">
          <TypeEyebrow post={post} />
          <Heading>{post.title}</Heading>
          <p>{post.description}</p>
          <span className="jr-card-meta">
            <time dateTime={post.published_at}>{formatPostDate(post.published_at)}</time>
            <span>{readTimeLabel(post.read_minutes)}</span>
          </span>
        </span>
      </a>
    </li>
  );
}

export function RssIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <circle cx="3" cy="13" r="2" />
      <path d="M1 6.5a8.5 8.5 0 0 1 8.5 8.5H7.4A6.4 6.4 0 0 0 1 8.6z" />
      <path d="M1 1.5A13.5 13.5 0 0 1 14.5 15h-2.1A11.4 11.4 0 0 0 1 3.6z" />
    </svg>
  );
}

export function RssLink({ className = "" }: { className?: string }) {
  return (
    <a className={className} href={JOURNAL_FEED_URL.replace("https://trytoone.com", "")} type="application/rss+xml">
      <RssIcon /> RSS
    </a>
  );
}
