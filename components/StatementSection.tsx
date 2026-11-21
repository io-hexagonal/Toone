import { getTranslations } from "next-intl/server";
import type { LandingAudience } from "@/components/LandingAudienceBar";
import StatementVideo from "@/components/StatementVideo";

/**
 * The cream statement block right after the dark hero — the first beat of the
 * light editorial world: one big Rubik line, a short lead, one black pill.
 */
type Props = {
  audience?: LandingAudience;
};

export default async function StatementSection({ audience = "business" }: Props) {
  const namespace = audience === "personal" ? "landing.personal.statement" : "statement";
  const t = await getTranslations(namespace);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .stmt {
              position: relative; z-index: 5;
              background: #f0ede6; color: #1d1c19;
              text-align: center;
              padding: clamp(88px, 10vw, 118px) 24px clamp(56px, 6vw, 72px);
            }
            .stmt h2 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.02em; line-height: 1.1;
              font-size: clamp(30px, 3.6vw, 46px);
              max-width: 24ch; margin: 0 auto; text-wrap: balance;
            }
            .stmt p {
              color: #55534d; font-size: 16.5px; line-height: 1.65;
              max-width: 56ch; margin: 22px auto 34px;
            }
            .stmt .pill {
              display: inline-block; border-radius: 999px; text-decoration: none;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.01em; font-size: 14.5px;
              padding: 13px 28px; background: #141311; color: #f0ede6;
              transition: transform 0.15s ease;
            }
            .stmt .pill:hover { transform: scale(1.03); }
            .svid-track {
              position: relative; background: #f0ede6; height: 260vh;
              /* The statement follows right after the small card instead of a
                 screen of empty space below it. */
              margin-bottom: calc((min(880px, calc(100vw - 48px)) * 0.5625 - 100vh) / 2);
            }
            .svid-stage {
              /* Below the fixed header (z-index 40) until the video fills the screen. */
              position: sticky; top: 0; height: 100vh; z-index: 30; pointer-events: none;
              display: flex; align-items: center; justify-content: center; overflow: hidden;
            }
            .svid-stage[data-full] { z-index: 45; }
            .svid-frame {
              --p: 0; --w0: min(880px, calc(100vw - 48px));
              width: calc(var(--w0) + (100% - var(--w0)) * var(--p));
              height: calc(var(--w0) * 0.5625 + (100vh - var(--w0) * 0.5625) * var(--p));
              border-radius: calc(18px * (1 - var(--p)));
              pointer-events: auto; /* the stage sits above the fixed header (z 40) so the full-screen video covers it */
              background: #000; overflow: hidden;
              box-shadow: 0 24px 60px rgba(20, 19, 17, calc(0.22 * (1 - var(--p))));
              will-change: width, height;
            }
            .svid-frame { position: relative; }
            .svid-frame video { display: block; width: 100%; height: 100%; object-fit: contain; background: #000; cursor: pointer; }
            .svid-sound {
              position: absolute; right: 16px; bottom: 16px; width: 40px; height: 40px; border-radius: 999px;
              border: 0; display: grid; place-items: center; cursor: pointer;
              background: rgba(20, 19, 17, 0.72); color: #f0ede6;
            }
            .svid-sound:hover { background: rgba(20, 19, 17, 0.9); }
            .svid-unmute {
              position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%);
              display: inline-flex; align-items: center; gap: 10px; border: 0; cursor: pointer;
              padding: 12px 22px; border-radius: 999px; font: 600 15px/1 var(--font-wordmark), system-ui, sans-serif;
              background: rgba(240, 237, 230, 0.95); color: #141311; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            }
            .svid-play {
              position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
              width: 76px; height: 76px; border-radius: 999px;
              display: grid; place-items: center;
              background: rgba(240, 237, 230, 0.94); color: #141311;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); transition: transform 0.15s ease;
            }
            .svid-play { border: 0; cursor: pointer; }
            .svid-play:hover { transform: translate(-50%, -50%) scale(1.06); }
            @media (prefers-reduced-motion: reduce) {
              .svid-track { height: auto; padding: 72px 0 0; margin-bottom: 0; }
              .svid-stage { position: static; height: auto; }
            }
          `,
        }}
      />
      <StatementVideo label={t("videoLabel")} playLabel={t("videoPlay")} muteLabel={t("videoMute")} unmuteLabel={t("videoUnmute")} />
      <section className="stmt" id="statement">
        <h2>{t("title")}</h2>
        <p>{t("lead")}</p>
        <a className="pill" href="#how">
          {t("cta")}
        </a>
      </section>
    </>
  );
}
