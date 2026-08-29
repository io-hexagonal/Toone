import { getTranslations } from "next-intl/server";
import type { LandingAudience } from "@/components/LandingAudienceBar";

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
          `,
        }}
      />
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
