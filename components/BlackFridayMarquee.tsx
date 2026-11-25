import { Link } from "@/lib/navigation";
import { checkoutPromotionEnds } from "@/lib/billing/checkout-promo";

/**
 * Black Friday Week strip: a black bar in the audience bar's slot whose text
 * scrolls from right to left. Server-rendered, CSS-only animation. The track
 * holds two identical halves and moves by -50%, so the loop has no seam.
 * Hover pauses it; reduced motion shows it still.
 *
 * Offer: BLACKFRIDAY, 80% off Lifetime (€199.99 → €40), the site-wide code
 * in lib/billing/checkout-promo.ts. The page is built ahead of time, so an
 * inline script checks the clock before paint: once the code has ended it
 * marks <html class="bf-over">, which hides this strip and brings the
 * Personal / Business bar back. No rebuild needed when the week ends.
 */
const ENDS_AT = checkoutPromotionEnds("BLACKFRIDAY")?.getTime() ?? 0;
/** Strip height; the site header moves down to sit right under it. */
const BAR_HEIGHT = 46;

const ITEMS: { text: string; hot?: boolean }[] = [
  { text: "Black Friday Week" },
  { text: "80% off Toone Lifetime", hot: true },
  { text: "Pay once, keep Toone for good" },
  { text: "Hand off the work that comes back every week" },
  { text: "Claim 80% off →", hot: true },
];

function Half({ hidden }: { hidden?: boolean }) {
  // Repeat the item set so one half is wider than a large screen.
  const run = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="bf-half" aria-hidden={hidden ? "true" : undefined}>
      {run.map((item, i) => (
        <span className="bf-item" key={i}>
          <span className={item.hot ? "bf-text bf-hot" : "bf-text"}>{item.text}</span>
          <span className="bf-sep" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
}

export default function BlackFridayMarquee() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html:not(.bf-over) .landing-audience-bar { display: none; }
            html.bf-over .bf-bar { display: none; }
            .bf-bar {
              position: relative; z-index: 51; display: block;
              height: ${BAR_HEIGHT}px; overflow: hidden;
              background: #000; color: #fff; text-decoration: none;
            }
            .bf-track {
              display: flex; width: max-content; height: 100%;
              animation: bf-scroll 60s linear infinite;
            }
            .bf-bar:hover .bf-track, .bf-bar:focus-visible .bf-track { animation-play-state: paused; }
            .bf-bar:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
            .bf-half { display: flex; align-items: center; height: 100%; }
            .bf-item { display: inline-flex; align-items: center; white-space: nowrap; }
            .bf-text {
              font-size: 12.5px; font-weight: 600; letter-spacing: 0.14em;
              text-transform: uppercase; line-height: 1;
            }
            .bf-hot {
              display: inline-flex; align-items: center;
              padding: 7px 14px; border-radius: 999px;
              background: #fff; color: #000;
              font-size: 14px; font-weight: 800; letter-spacing: 0.1em;
            }
            .bf-sep { margin: 0 22px; font-size: 9px; opacity: 0.55; }
            /* The header is fixed at top: 36px for the old 36px bar; sit it under this taller strip. */
            html:not(.bf-over) .hdr2:not([data-scrolled="true"]) { top: ${BAR_HEIGHT}px; }
            @keyframes bf-scroll {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .bf-track { animation: none; }
            }
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(Date.now()>${ENDS_AT})document.documentElement.classList.add("bf-over")}catch(e){}`,
        }}
      />
      <Link href="/pricing" className="bf-bar" aria-label="Black Friday Week: 80% off Toone Lifetime, see pricing">
        <div className="bf-track">
          <Half />
          <Half hidden />
        </div>
      </Link>
    </>
  );
}
