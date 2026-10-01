import { getBundle, getRoutine, resolveCardCoverUrl, resolveSlug } from "@/lib/explore/api";
import type { ExploreBlock } from "@/lib/journal/markdown";
import type { JournalExploreRef } from "@/lib/journal/types";
import CoverImage from "@/components/explore/CoverImage";

/**
 * ```explore blocks (contract §6.3, §10). Each block resolves through the
 * Explore fetchers (data cache, tags `explore` / `explore:{slug}`), so an
 * Explore approval or removal also refreshes the card inside the post. A
 * record that is missing, private or unreachable renders as a plain link to
 * its Explore URL: an embed never breaks the article.
 */

export type ExploreCard = {
  type: "routine" | "bundle";
  href: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  meta: string[];
};

export type ResolvedEmbed = { href: string; card: ExploreCard | null };

export function embedKey(block: Pick<ExploreBlock, "type" | "ref">): string {
  return `${block.type}:${block.ref}`;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** The canonical Explore URL for a block, preferring the server-resolved slug. */
export function fallbackHref(block: ExploreBlock, refs: JournalExploreRef[]): string {
  const ref = refs.find(
    (item) => item.type === block.type && (item.slug === block.ref || item.id === block.ref),
  );
  return `/en/explore/${block.type}s/${encodeURIComponent(ref?.slug || block.ref)}`;
}

async function resolveOne(block: ExploreBlock, refs: JournalExploreRef[]): Promise<ResolvedEmbed> {
  const href = fallbackHref(block, refs);
  try {
    if (block.type === "routine") {
      const detail = await getRoutine(block.ref);
      if (!detail) return { href, card: null };
      const search = detail.listing_profile?.search;
      return {
        href: `/en/explore/routines/${resolveSlug(detail)}`,
        card: {
          type: "routine",
          href: `/en/explore/routines/${resolveSlug(detail)}`,
          title: search?.display_title || detail.title,
          summary: search?.meta_description || detail.summary,
          coverUrl: resolveCardCoverUrl(detail),
          meta: [plural(detail.step_count, "step"), plural(detail.agent_count, "agent")],
        },
      };
    }
    const detail = await getBundle(block.ref);
    if (!detail) return { href, card: null };
    const search = detail.listing_profile?.search;
    return {
      href: `/en/explore/bundles/${resolveSlug(detail)}`,
      card: {
        type: "bundle",
        href: `/en/explore/bundles/${resolveSlug(detail)}`,
        title: search?.display_title || detail.title,
        summary: search?.meta_description || detail.summary,
        coverUrl: resolveCardCoverUrl(detail),
        meta: [plural(detail.member_count, "routine")],
      },
    };
  } catch (error) {
    console.warn(
      `[journal] explore embed ${embedKey(block)} unavailable`,
      error instanceof Error ? error.message : error,
    );
    return { href, card: null };
  }
}

/** Resolve every distinct block of a body in parallel. */
export async function resolveExploreEmbeds(
  blocks: ExploreBlock[],
  refs: JournalExploreRef[],
): Promise<Map<string, ResolvedEmbed>> {
  const unique = new Map<string, ExploreBlock>();
  for (const block of blocks) if (!unique.has(embedKey(block))) unique.set(embedKey(block), block);
  const entries = await Promise.all(
    [...unique.entries()].map(async ([key, block]) => [key, await resolveOne(block, refs)] as const),
  );
  return new Map(entries);
}

export function ExploreEmbedView({
  block,
  embed,
}: {
  block: ExploreBlock;
  embed: ResolvedEmbed | undefined;
}) {
  const noun = block.type === "routine" ? "routine" : "bundle";
  const card = embed?.card;
  if (!card) {
    return (
      <p className="jr-explore-fallback">
        <a href={embed?.href ?? `/en/explore/${block.type}s/${encodeURIComponent(block.ref)}`}>
          Open this {noun} in Explore →
        </a>
      </p>
    );
  }
  return (
    <a
      className={`jr-explore${block.variant === "compact" ? " jr-explore--compact" : ""}`}
      href={card.href}
      data-explore-type={card.type}
    >
      <span className="jr-cover" data-type="spotlight" aria-hidden="true">
        <span className="jr-cover-placeholder">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="jr-cover-mark" src="/assets/brand/toone-mark.svg" alt="" width={28} height={28} />
        </span>
        {card.coverUrl && <CoverImage className="jr-cover-img" src={card.coverUrl} />}
      </span>
      <span className="jr-explore-copy">
        <span className="jr-card-eyebrow">{card.type === "routine" ? "Routine in Explore" : "Bundle in Explore"}</span>
        <span className="jr-explore-title">{card.title}</span>
        <span className="jr-explore-summary">{card.summary}</span>
        <span className="jr-explore-foot">
          {card.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <span className="jr-explore-cta">View in Explore →</span>
        </span>
      </span>
    </a>
  );
}
