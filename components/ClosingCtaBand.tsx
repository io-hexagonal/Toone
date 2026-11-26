import { getTranslations } from "next-intl/server";
import CreateAccountLink from "@/components/CreateAccountLink";
import { Link } from "@/lib/navigation";
import { TOONE_PRO_FREE_ROUTINE_CREATIONS } from "@/lib/legal/terms";

/**
 * Closing ask before the FAQ: start small. On the hero's dot field, one headline, three plain facts
 * that take the risk out of trying (free routines, unlimited runs, the AI
 * plan you already have), the primary button (same destination and
 * analytics event as the hero's) and a quieter way in.
 */
const FACTS = ["free", "runs", "plan"] as const;

export default async function ClosingCtaBand() {
  const t = await getTranslations("landing.closing");
  const nav = await getTranslations("nav");

  return (
    <section className="section cta-band" aria-labelledby="cta-band-title">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cta-band { text-align: center; }
            .cta-band-inner { position: relative; isolation: isolate; padding: clamp(72px, 8vw, 110px) 24px; }
            /* The hero's dot field, bookending the page: a soft ring around the
               text, never behind it, dissolving toward every edge (no hard sides). */
            .cta-dots {
              position: absolute; inset: 0; z-index: -1; pointer-events: none;
              opacity: 0.2;
              background: linear-gradient(95deg, #2b2a27 0%, #6b6862 100%);
              -webkit-mask-image:
                radial-gradient(circle closest-side, #000 55%, transparent 66%),
                radial-gradient(ellipse 50% 50% at 50% 50%, transparent 55%, #000 80%),
                radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%);
              -webkit-mask-size: 6px 6px, 100% 100%, 100% 100%;
              -webkit-mask-repeat: repeat, no-repeat, no-repeat;
              -webkit-mask-composite: source-in;
                      mask-image:
                radial-gradient(circle closest-side, #000 55%, transparent 66%),
                radial-gradient(ellipse 50% 50% at 50% 50%, transparent 55%, #000 80%),
                radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%);
                      mask-size: 6px 6px, 100% 100%, 100% 100%;
                      mask-repeat: repeat, no-repeat, no-repeat;
                      mask-composite: intersect;
            }
            /* phones: the text fills the width, so the dots only frame it above and below */
            @media (max-width: 640px) {
              .cta-dots {
                -webkit-mask-image:
                  radial-gradient(circle closest-side, #000 55%, transparent 66%),
                  linear-gradient(180deg, transparent 0%, #000 6%, transparent 16%, transparent 86%, #000 94%, transparent 100%);
                -webkit-mask-size: 6px 6px, 100% 100%;
                -webkit-mask-repeat: repeat, no-repeat;
                        mask-image:
                  radial-gradient(circle closest-side, #000 55%, transparent 66%),
                  linear-gradient(180deg, transparent 0%, #000 6%, transparent 16%, transparent 86%, #000 94%, transparent 100%);
                        mask-size: 6px 6px, 100% 100%;
                        mask-repeat: repeat, no-repeat;
              }
            }
            .cta-band h2#cta-band-title {
              max-width: 20ch; margin: 0 auto 16px; text-wrap: balance;
            }
            .cta-sub { color: rgba(29,28,25,0.64); font-size: 17.5px; line-height: 1.55; max-width: 52ch; margin: 0 auto 26px; text-wrap: balance; }
            .cta-facts {
              display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 22px;
              list-style: none; margin: 0 0 30px; padding: 0;
            }
            .cta-facts li { display: inline-flex; align-items: center; gap: 7px; color: rgba(29,28,25,0.78); font-size: 15px; font-weight: 500; }
            .cta-facts svg { width: 13px; height: 13px; color: rgba(29,28,25,0.55); }
            .cta-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 22px; }

          `,
        }}
      />
      <div className="cta-band-inner">
        <div className="cta-dots" aria-hidden="true" />
        <h2 id="cta-band-title">{t("title")}</h2>
        <p className="cta-sub">{t("sub")}</p>
        <ul className="cta-facts">
          {FACTS.map((fact) => (
            <li key={fact}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3.4 8.4 2.9 2.9 6.3-6.6" />
              </svg>
              {t(`facts.${fact}`, { free: TOONE_PRO_FREE_ROUTINE_CREATIONS })}
            </li>
          ))}
        </ul>
        <div className="cta-actions">
          <CreateAccountLink className="holo-btn" placement="closing-band">{nav("download")}</CreateAccountLink>
          <Link className="text-link" href="/explore">{t("explore")}</Link>
        </div>
      </div>
    </section>
  );
}
