import type { CSSProperties, ReactNode } from "react";
import { ExploreCover, ExplorePriceTag } from "./ExploreBlocks";
import styles from "./ListingHero.module.css";

/**
 * P18 ListingHero: the top card of an Explore listing page.
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
