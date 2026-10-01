import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingId } from "@/lib/content";
import { resolveAssetUrl } from "@/lib/journal/data";
import {
  assetIdFromSrc,
  extractExploreBlocks,
  journalTableOfContents,
  opensExploreFence,
  parseExploreBlock,
} from "@/lib/journal/markdown";
import {
  CHANNEL_LABELS,
  EDITORIAL_POLICY_PATH,
  differentDay,
  disclosureText,
  formatPostDate,
  hubForType,
  listPath,
  postEyebrow,
  readTimeLabel,
} from "@/lib/journal/presentation";
import type { JournalPostDetail, JournalPostEntry } from "@/lib/journal/types";
import { ExploreEmbedView, embedKey, resolveExploreEmbeds, type ResolvedEmbed } from "./ExploreEmbed";
import { JournalShell, PostCard, RssLink } from "./JournalParts";

/**
 * One Journal post (contract §10). Everything — hero, byline, body, embeds —
 * is server-rendered into the first byte; nothing here suspends or needs
 * JavaScript. The preview route renders the same component with a banner.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  position?: { start?: { line?: number } };
};

function hastText(node: HastNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

/**
 * Site-relative links gain the `/en` prefix the Journal lives under (as the
 * guides localize theirs); files (`/journal/feed.xml`, `/assets/…`) and
 * already-prefixed paths are left alone.
 */
export function journalHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href.startsWith("/assets/") || href.startsWith("/_next/")) return href;
  if (/^\/(?:en|pt|es|fr|de|it|nl|ru)(?:[/?#]|$)/.test(href)) return href;
  const path = href.split(/[?#]/)[0];
  if (/\.[a-z0-9]+$/i.test(path)) return href;
  return `/en${href === "/" ? "" : href}`;
}

/** `asset:` image refs survive sanitizing; everything else gets react-markdown's default. */
function urlTransform(url: string): string {
  return assetIdFromSrc(url) ? url : defaultUrlTransform(url);
}

function markdownComponents(
  post: JournalPostDetail,
  embeds: Map<string, ResolvedEmbed>,
): Components {
  const bodyLines = post.body.split("\n");
  return {
    h1: ({ children }) => <h2>{children}</h2>,
    h2: ({ node, children }) => <h2 id={headingId(hastText(node as HastNode))}>{children}</h2>,
    h3: ({ node, children }) => <h3 id={headingId(hastText(node as HastNode))}>{children}</h3>,
    a: ({ href = "", children }) => {
      const target = journalHref(href);
      const external = /^https?:\/\//.test(target) && !target.startsWith("https://trytoone.com/");
      return (
        <a href={target} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
          {children}
        </a>
      );
    },
    img: ({ src, alt = "" }) => {
      const id = typeof src === "string" ? assetIdFromSrc(src) : null;
      const asset = id ? post.assets[id] : undefined;
      const url = asset ? resolveAssetUrl(asset.url) : null;
      if (!asset || !url) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="jr-image"
          src={url}
          alt={alt}
          width={asset.width}
          height={asset.height}
          loading="lazy"
          decoding="async"
        />
      );
    },
    pre: ({ node, children }) => {
      const pre = node as HastNode | undefined;
      const code = pre?.children?.find((child) => child.type === "element");
      // The fence's own source line decides, through the same predicate as
      // `extractExploreBlocks`. The `language-explore` class is not enough:
      // remark gives it to `explore compact` too (the extra words go to
      // `meta`), which the server does not accept as a block.
      if (code?.tagName === "code" && opensExploreFence(bodyLines, pre?.position?.start?.line)) {
        const block = parseExploreBlock(hastText(code));
        if (block) return <ExploreEmbedView block={block} embed={embeds.get(embedKey(block))} />;
      }
      return <pre>{children}</pre>;
    },
    code: ({ className, children }) => {
      if (className === "language-mermaid") {
        return (
          <code className="jr-mermaid" role="img" aria-label="Mermaid diagram source">
            {children}
          </code>
        );
      }
      return <code className={className}>{children}</code>;
    },
  };
}

export type ArticleProps = {
  post: JournalPostDetail;
  related?: JournalPostEntry[];
  /** Preview mode: a banner, no related posts, dates read as "not published". */
  preview?: { state: "draft" | "published" | "retired" } | null;
};

/** Resolve embeds, then render. */
export async function JournalArticle({ post, related = [], preview = null }: ArticleProps) {
  const embeds = await resolveExploreEmbeds(extractExploreBlocks(post.body), post.explore_refs);
  const toc = journalTableOfContents(post.body).filter((item) => item.level === 2);
  const hub = hubForType(post.type);
  const disclosure = disclosureText(post.assistance);
  const cover = post.cover ? resolveAssetUrl(post.cover.url) : null;
  const banner: ReactNode = preview ? (
    <div className="jr-preview-banner" role="status">
      Preview — not published
      <span>
        {preview.state === "draft"
          ? "This draft is private. Do not share this link."
          : `Unpublished revision of a ${preview.state} post. The live page is unchanged until it is published.`}
      </span>
    </div>
  ) : null;

  return (
    <JournalShell banner={banner}>
      <header className="jr-hero jr-article-hero">
        <div className="jr-hero-inner">
          <nav className="jr-breadcrumb" aria-label="Breadcrumb">
            <a href="/en">Home</a>
            <span aria-hidden="true">→</span>
            <a href={listPath(null)}>Journal</a>
            <span aria-hidden="true">→</span>
            <a href={listPath(hub)}>{hub.label}</a>
            <span aria-hidden="true">→</span>
            <span aria-current="page">{post.title}</span>
          </nav>
          <p className="jr-eyebrow">{postEyebrow(post)}</p>
          <h1>{post.heading}</h1>
          <p className="jr-deck">{post.description}</p>
          {post.type === "release" && post.release && (
            <ul className="jr-release" aria-label="Release">
              <li className="jr-version">Version {post.release.version}</li>
              {post.release.channels.map((channel) => (
                <li key={channel}>{CHANNEL_LABELS[channel]}</li>
              ))}
            </ul>
          )}
          <div className="jr-byline">
            <span>
              By{" "}
              {post.author.url ? <a href={journalHref(post.author.url)}>{post.author.name}</a> : post.author.name}
            </span>
            {preview && preview.state === "draft" ? (
              <span>Not published yet</span>
            ) : (
              <>
                <span>
                  Published <time dateTime={post.published_at}>{formatPostDate(post.published_at)}</time>
                </span>
                {differentDay(post.published_at, post.updated_at) && (
                  <span>
                    Updated <time dateTime={post.updated_at}>{formatPostDate(post.updated_at)}</time>
                  </span>
                )}
              </>
            )}
            <span>{readTimeLabel(post.read_minutes)}</span>
          </div>
          {disclosure && (
            <p className="jr-disclosure">
              {disclosure} <a href={EDITORIAL_POLICY_PATH}>Read our editorial policy</a>
            </p>
          )}
        </div>
        {cover && post.cover && (
          <figure className="jr-hero-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
              fetchPriority="high"
            />
          </figure>
        )}
      </header>
      <main className={`jr-article-layout${toc.length < 2 ? " jr-no-toc" : ""}`}>
        <article className="jr-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            urlTransform={urlTransform}
            components={markdownComponents(post, embeds)}
          >
            {post.body}
          </ReactMarkdown>
          <aside className="jr-close">
            <h2>More from the Journal</h2>
            <p>Release notes, routine spotlights and launches from the team building Toone.</p>
            <div className="jr-close-links">
              <a href={listPath(hub)}>All {hub.label.toLowerCase()} →</a>
              <a href={listPath(null)}>Every post →</a>
              <RssLink />
            </div>
          </aside>
        </article>
        {toc.length >= 2 && (
          <aside className="jr-toc" aria-label="On this page">
            <p className="jr-toc-title">On this page</p>
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </aside>
        )}
      </main>
      {related.length > 0 && (
        <section className="jr-related jr-width" aria-labelledby="jr-related-title">
          <h2 id="jr-related-title">More {hub.label.toLowerCase()}</h2>
          <ul className="jr-grid">
            {related.map((item) => (
              <PostCard key={item.post_id} post={item} headingLevel={3} />
            ))}
          </ul>
        </section>
      )}
    </JournalShell>
  );
}
