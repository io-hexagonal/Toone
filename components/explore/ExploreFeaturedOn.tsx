import { getTranslations } from "next-intl/server";
import { FEATURED_BADGES } from "@/lib/featured-badges";

/** Directories whose badge also shows at the foot of the Explore library. */
const EXPLORE_BADGES = ["MacBase"];

/**
 * "Featured on" at the foot of the Explore library. Same snippets as the
 * landing strip (`lib/featured-badges.ts`), rendered as issued: plain
 * <a><img></a>, exact href, image URL and rel.
 */
export default async function ExploreFeaturedOn() {
  const badges = FEATURED_BADGES.filter((badge) => EXPLORE_BADGES.includes(badge.name));
  if (badges.length === 0) return null;
  const t = await getTranslations("footer");
  return (
    <section className="explore-featured-on" aria-labelledby="explore-featured-on">
      <p className="explore-featured-on-label" id="explore-featured-on">
        {t("featuredOn")}
      </p>
      <ul>
        {badges.map((badge) => (
          <li key={badge.name}>
            <a href={badge.href} target="_blank" rel={badge.rel}>
              {/* Exact image URL as issued by the directory; next/image would rewrite it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badge.img}
                alt={badge.alt}
                width={badge.width}
                height={badge.height}
                style={badge.style}
                loading="lazy"
                decoding="async"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
