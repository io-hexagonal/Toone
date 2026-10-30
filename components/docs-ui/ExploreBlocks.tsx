import type { CSSProperties, ReactNode } from "react";
import styles from "./ExploreBlocks.module.css";
import type { ExploreListing } from "./exploreListings";
import { Glyph } from "./glyphs";

/**
 * P18 ExploreBlocks: the Explore catalog card and its pieces.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - ExploreCatalogCard: APP/Features/WorkflowCatalog/ListingProfilePage.swift:506-599
 *   (HStack top, spacing 16; cover 144×81; text VStack spacing 5; padding 12;
 *   threadCardBackground r12 + 1pt threadCardBorder; chevron.right 12 semibold
 *   tertiary, top 4).
 * - Eyebrow: Typography.Listing.label (11 semibold, NOT bold as plan §2.2 says),
 *   tracking 1.0, accent, uppercased (Typography.swift:131, LetterSpacing.wider).
 * - ExplorePriceTag: ListingProfilePage.swift:466-481 (11/600 accent, padding
 *   8/2, threadCardBackground capsule + threadCardBorder).
 * - ExploreAuthorByline: ListingProfilePage.swift:483-503 ("By Toone" + the
 *   TooneMarkPixel image at 13pt for official items, cardMeta tertiary).
 * - Routine cover: WorkflowExplorerView.swift:369-379 (r8 + 1pt threadCardBorder).
 * - Bundle covers: WorkflowExplorerView.swift:381-395 (two 132×74, the second
 *   member's rotated 5° and offset 4/-3 behind the bundle's; r10 default from
 *   WorkflowCoverImageView, WorkflowCatalogDTOs.swift:868-902).
 *
 * Covers are flat gradient placeholders, never the real cover art.
 * Listing page blocks (end of file): ListingSection, ListingProfileCard,
 * ListingKeyValueBox / Line, ListingLabel, ListingBodyText, ListingItemTitle
 * (ListingProfilePage.swift:253-458).
 * Not built yet (no scene needs it): ListingHero (ListingProfilePage.swift:10-80).
 */

export function ExploreCover({
  background,
  width = 144,
  height = 81,
  radius = 10,
  stroke = false,
  style,
}: {
  /** CSS background, e.g. one of the `cover` gradients in exploreListings.ts. */
  background: string;
  width?: number;
  height?: number;
  radius?: number;
  /** 1pt threadCardBorder stroke (routine cards draw one, bundle covers don't). */
  stroke?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={styles.cover}
      data-stroke={stroke ? "true" : undefined}
      style={{ width, height, borderRadius: radius, background, ...style }}
    />
  );
}

/** Routine card cover: 144×81, CornerRadius.small (8) + threadCardBorder. */
export function RoutineCardCover({ background }: { background: string }) {
  return <ExploreCover background={background} radius={8} stroke />;
}

/** Bundle card cover: the second member's cover tilted behind the bundle's own. */
export function BundleCardCovers({ front, back }: { front: string; back?: string }) {
  return (
    <span className={styles.bundleCovers}>
      {back ? (
        <ExploreCover
          background={back}
          height={74}
          style={{ position: "absolute", transform: "translate(4px, -3px) rotate(5deg)" }}
          width={132}
        />
      ) : null}
      <ExploreCover background={front} height={74} style={{ position: "absolute" }} width={132} />
    </span>
  );
}

export function ExplorePriceTag({ label }: { label: string }) {
  return <span className={styles.priceTag}>{label}</span>;
}

export function ExploreAuthorByline({ name, official }: { name: string; official: boolean }) {
  return (
    <span className={styles.byline}>
      {official ? <span aria-hidden="true" className={styles.tooneMark} /> : null}
      <span>By {official ? "Toone" : name}</span>
    </span>
  );
}

type CardProps = {
  eyebrow: string;
  title: string;
  category?: string;
  summary: string;
  audience?: string[];
  meta?: string[];
  author?: string;
  official?: boolean;
  tags?: string[];
  price?: string;
  cover: ReactNode;
};

/** ExploreCatalogCard (ListingProfilePage.swift:506-599). */
export function ExploreCard({
  eyebrow,
  title,
  category,
  summary,
  audience = [],
  meta = [],
  author,
  official = false,
  tags = [],
  price,
  cover,
}: CardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.coverSlot}>{cover}</span>
      <div className={styles.text}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>{eyebrow.toUpperCase()}</span>
          {price ? <ExplorePriceTag label={price} /> : null}
        </div>
        <span className={styles.title}>{title}</span>
        {category ? <span className={styles.metaEmphasis}>{category}</span> : null}
        <span className={styles.summary}>{summary}</span>
        {audience.length > 0 ? (
          <span className={styles.audience}>
            <span className={styles.metaEmphasisInline}>For: </span>
            {audience.join(", ")}
          </span>
        ) : null}
        {meta.length > 0 ? <span className={styles.meta}>{meta.join(" · ")}</span> : null}
        {official || author ? <ExploreAuthorByline name={author ?? ""} official={official} /> : null}
        {tags.length > 0 ? (
          <span className={styles.tags}>
            {tags.map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <span className={styles.chevron}>
        <Glyph name="chevron.right" size={12} weight="semibold" />
      </span>
    </div>
  );
}

/** Convenience: an ExploreCard from a listing in exploreListings.ts. */
export function ExploreListingCard({ listing, back }: { listing: ExploreListing; back?: ExploreListing }) {
  const isBundle = listing.kind === "bundle";
  return (
    <ExploreCard
      audience={listing.audience}
      author={listing.author}
      category={listing.category}
      cover={
        isBundle ? (
          <BundleCardCovers back={back?.cover} front={listing.cover} />
        ) : (
          <RoutineCardCover background={listing.cover} />
        )
      }
      eyebrow={isBundle ? `Bundle · ${listing.memberCount ?? 0} routines` : "Routine"}
      meta={listing.meta}
      official={listing.official}
      price={listing.price}
      summary={listing.summary}
      tags={listing.tags}
      title={listing.title}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Listing page building blocks (ListingProfilePage.swift:253-458)     */
/* ------------------------------------------------------------------ */

/**
 * ListingProfileSection (ListingProfilePage.swift:253-302): Divider, then the
 * heading (body semibold, tracking -0.25) 16 below it, content 12 below
 * that, 24 after the section. `collapsible` sections show an accent
 * `chevron.right` (13 semibold, spacing 10), rotated 90° when open.
 */
export function ListingSection({
  title,
  collapsible = false,
  open = true,
  children,
}: {
  title: string;
  collapsible?: boolean;
  /** Only for collapsible sections (they start closed in the app). */
  open?: boolean;
  children?: ReactNode;
}) {
  const showContent = !collapsible || open;
  return (
    <section className={styles.listingSection}>
      <div className={styles.listingDivider} />
      <div className={styles.listingHeadingRow}>
        {collapsible ? (
          <span className={styles.listingDisclosure} style={open ? { transform: "rotate(90deg)" } : undefined}>
            <Glyph name="chevron.right" size={13} weight="semibold" />
          </span>
        ) : null}
        <span className={styles.listingHeading}>{title}</span>
      </div>
      {showContent ? children : null}
    </section>
  );
}

/** ListingProfileCard (:304-316): VStack spacing 6, padding 18, card fill r16 + border. */
export function ListingProfileCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.listingCard} style={style}>
      {children}
    </div>
  );
}

/** ListingBodyText (:429-446): 13 regular; secondary unless primary / tertiary. */
export function ListingBodyText({
  children,
  primary = false,
  tertiary = false,
}: {
  children: ReactNode;
  primary?: boolean;
  tertiary?: boolean;
}) {
  return (
    <span className={styles.listingBody} data-tone={primary ? "primary" : tertiary ? "tertiary" : undefined}>
      {children}
    </span>
  );
}

/** ListingLabel (:448-458): uppercased, 11 semibold, tracking 1.0, tertiary. */
export function ListingLabel({ children }: { children: string }) {
  return <span className={styles.listingLabel}>{children.toUpperCase()}</span>;
}

/** Item title: Typography.Listing.itemTitle (body semibold), primary. */
export function ListingItemTitle({ children, link = false }: { children: ReactNode; link?: boolean }) {
  return (
    <span className={styles.listingItemTitle} data-link={link ? "true" : undefined}>
      {children}
    </span>
  );
}

/** ListingKeyValueLine (:365-375): label over a primary value, top padding 4. */
export function ListingKeyValueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.listingKeyValueLine}>
      <ListingLabel>{label}</ListingLabel>
      <ListingBodyText primary>{value}</ListingBodyText>
    </div>
  );
}

/**
 * ListingKeyValueBox (:318-339): rows split by dividers; each row HStack
 * first-baseline spacing 16, key 13 semibold primary in 150, value body
 * secondary, padding 10/14; card fill r16 + border.
 */
export function ListingKeyValueBox({ rows, style }: { rows: [string, string][]; style?: CSSProperties }) {
  return (
    <div className={styles.listingKeyValueBox} style={style}>
      {rows.map(([key, value], index) => (
        <div className={styles.listingKeyValueRow} data-divider={index > 0 ? "true" : undefined} key={key}>
          <span className={styles.listingKey}>{key}</span>
          <ListingBodyText>{value}</ListingBodyText>
        </div>
      ))}
    </div>
  );
}
