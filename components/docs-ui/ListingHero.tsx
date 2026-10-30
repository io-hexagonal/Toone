import type { CSSProperties, ReactNode } from "react";
import { ExploreCover, ExplorePriceTag } from "./ExploreBlocks";
import styles from "./ListingHero.module.css";

/**
 * P18 ListingHero: the top card of an Explore listing page.
 *
 * Source: APP/Features/WorkflowCatalog/ListingProfilePage.swift:10-80
 * (APP = apps/toone-desktop/Toone/Toone/):
 * - ViewThatFits: HStack (text ≥320, spacing 32, cover 300×225) when it fits,
 *   otherwise VStack spacing 20 with the cover (4:3, ≤360 wide) above the
 *   text. The HStack needs ≥708pt, wider than any docs figure, so figures
 *   use `layout="stacked"` (the default);
 * - padding 28, threadCardBackground, r18 continuous, threadCardBorder;
 * - text VStack spacing 14: eyebrow (11 bold, tracking 2/1.4, accent,
 *   uppercased) + ExplorePriceTag; title (.body semibold, tracking −0.5,
 *   textPrimary); summary (.body, lineSpacing 3, textSecondary, ≤620);
 *   chips (FlowLayout spacing 8; 12 medium textSecondary, padding 12/6,
 *   accent .08 capsule + threadCardBorder); then the actions;
 * - cover: WorkflowCoverImageView r18 + threadCardBorder stroke, shadow
 *   black .25 radius 16 y 8. Covers are flat placeholders, never real art.
 *
 * To show a page scrolled past most of the cover, give the hero a negative
 * top margin inside the scene's crop (the Figure clips it).
 */
export function ListingHero({
  eyebrow,
  title,
  summary,
  chips,
  price,
  cover,
  layout = "stacked",
  width,
  actions,
  style,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  chips: string[];
  /** "Free", "$19.99"; omit to hide the tag (author previews). */
  price?: string;
  /** CSS background of the placeholder cover. */
  cover: string;
  layout?: "stacked" | "row";
  /** Hero width; the stacked cover is min(width − 56, 360) wide. */
  width: number;
  actions?: ReactNode;
  style?: CSSProperties;
}) {
  const stacked = layout === "stacked";
  const coverW = stacked ? Math.min(width - 56, 360) : 300;
  const coverH = stacked ? Math.round((coverW * 3) / 4) : 225;
  return (
    <div
      className={styles.hero}
      data-layout={layout}
      style={{ width, ...style }}
    >
      <ExploreCover
        background={cover}
        height={coverH}
        radius={18}
        style={{ boxShadow: "inset 0 0 0 1px var(--tu-card-border), 0 8px 16px rgba(0, 0, 0, 0.25)" }}
        width={coverW}
      />
      <div className={styles.text}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>{eyebrow.toUpperCase()}</span>
          {price ? <ExplorePriceTag label={price} /> : null}
        </div>
        <span className={styles.title}>{title}</span>
        <span className={styles.summary}>{summary}</span>
        <div className={styles.chips}>
          {chips.map((chip) => (
            <span className={styles.chip} key={chip}>
              {chip}
            </span>
          ))}
        </div>
        {actions}
      </div>
    </div>
  );
}
