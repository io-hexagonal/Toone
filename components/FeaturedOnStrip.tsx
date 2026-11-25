import { getTranslations } from "next-intl/server";
import { FEATURED_BADGES, type FeaturedBadge } from "@/lib/featured-badges";

/**
 * "Featured on" strip under the landing's "Supported by" band, on the same
 * cream ground: a slow, endless row of directory badges. Directories verify their badge by loading the page, so the first
 * set is plain server-rendered <a><img></a>. The repeated sets only exist to
 * make the loop seamless; they are hidden from assistive tech and from the
 * tab order, and dropped entirely when the visitor prefers reduced motion.
 */

// One set of the six current badges is ~1,700px wide. Each half of the
// track repeats the set until it is wider than a large desktop viewport,
// so the loop never shows a gap; the track then holds two identical halves.
const MIN_HALF_WIDTH = 2000;
const GAP = 48;

function setWidth(badges: readonly FeaturedBadge[]) {
  return badges.reduce((sum, b) => sum + b.width + GAP, 0);
}

function BadgeSet({
  badges,
  copy,
}: {
  badges: readonly FeaturedBadge[];
  copy: boolean;
}) {
  return (
    <ul className={copy ? "fo-set fo-copy" : "fo-set"} aria-hidden={copy || undefined}>
      {badges.map((b) => (
        <li key={b.name}>
          <a
            href={b.href}
            target="_blank"
            rel={b.rel}
            tabIndex={copy ? -1 : undefined}
          >
            {/* Exact image URL as issued by the directory; next/image would rewrite it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.img}
              alt={copy ? "" : b.alt}
              width={b.width}
              height={b.height}
              className={b.framed ? "fo-framed" : undefined}
              style={b.style}
              loading="lazy"
              decoding="async"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  /**
   * "trust": inside a TrustPage (the About page): a plain section with the
   * page's own h2, in the text column, on the dark ground. The default is
   * the original cream, edge-to-edge landing strip.
   */
  variant?: "landing" | "trust";
};

export default async function FeaturedOnStrip({ variant = "landing" }: Props) {
  if (FEATURED_BADGES.length === 0) return null;
  const t = await getTranslations("footer");

  const perHalf = Math.max(1, Math.ceil(MIN_HALF_WIDTH / setWidth(FEATURED_BADGES)));
  const sets = perHalf * 2;
  // Seconds per half; ~35px a second regardless of how many badges there are.
  const duration = Math.round((perHalf * setWidth(FEATURED_BADGES)) / 35);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fo {
              position: relative; z-index: 5;
              /* Sits in the landing's padded .sections column, right under the
                 "Supported by" band; the negative margin lets the row run edge to edge. */
              margin: 0 -24px;
              padding: clamp(40px, 4.5vw, 56px) 0 0;
              text-align: center;
            }
            /* Same label as the "Supported by" band above it. */
            .fo-label {
              font-size: 11px; font-weight: 600; letter-spacing: 0.2em;
              text-transform: uppercase; color: rgba(29,28,25,0.42);
              margin: 0 0 22px;
            }
            @media (max-width: 640px) {
              .fo-label { font-size: 10px; letter-spacing: 0.14em; }
            }
            .fo-viewport {
              overflow: hidden;
              -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
                      mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
            }
            .fo-track {
              display: flex; width: max-content;
              animation: fo-scroll ${duration}s linear infinite;
            }
            .fo-viewport:hover .fo-track,
            .fo-viewport:focus-within .fo-track { animation-play-state: paused; }
            .fo-set {
              display: flex; align-items: center; gap: ${GAP}px;
              padding: 0 ${GAP}px 0 0; margin: 0; list-style: none;
            }
            .fo-set li { flex: none; display: flex; }
            .fo-set a { display: block; line-height: 0; border-radius: 10px; }
            .fo-set a:focus-visible { outline: 2px solid rgba(29,28,25,0.6); outline-offset: 4px; }
            /* Monotone: every badge in the same quiet gray; its own colour returns on hover or focus. */
            .fo-set img { display: block; max-width: none; filter: grayscale(1); opacity: 0.72; transition: opacity 0.2s ease, filter 0.2s ease; }
            .fo-set img.fo-framed { clip-path: inset(2.5px round 10px); }
            .fo-set a:hover img, .fo-set a:focus-visible img { opacity: 1; filter: grayscale(0); }
            /* Trust variant: the TrustPage section supplies padding, border and h2. */
            .fo--trust { margin: 0; text-align: left; }
            .fo--trust .fo-viewport { margin-top: 18px; }
            .fo--trust .fo-set a:focus-visible { outline-color: rgba(255,255,255,0.7); }
            @keyframes fo-scroll {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .fo-viewport { -webkit-mask-image: none; mask-image: none; }
              .fo-track { animation: none; width: auto; justify-content: center; }
              .fo-set { flex-wrap: wrap; justify-content: center; padding: 0 24px; gap: 20px 32px; }
              .fo-copy { display: none; }
            }
          `,
        }}
      />
      <section className={variant === "trust" ? "fo fo--trust" : "fo"} aria-labelledby="fo-label">
        {variant === "trust" ? (
          <h2 id="fo-label">{t("featuredOn")}</h2>
        ) : (
          <p className="fo-label" id="fo-label">
            {t("featuredOn")}
          </p>
        )}
        <div className="fo-viewport">
          <div className="fo-track">
            {Array.from({ length: sets }, (_, i) => (
              <BadgeSet key={i} badges={FEATURED_BADGES} copy={i > 0} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
