import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

/**
 * Closing ask before the FAQ: one sentence and the early-access pill. Same
 * destination and analytics event as the header's "Request Early Access"
 * (/request-access), so there is still only one request form.
 */
export default async function ClosingCtaBand() {
  const t = await getTranslations("landing.closing");
  const nav = await getTranslations("nav");

  return (
    <section className="section cta-band" aria-labelledby="cta-band-title">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .cta-band { text-align: center; }
            .cta-band-inner {
              padding: 64px 24px 68px;
              border-top: 1px solid rgba(29,28,25,0.12);
              border-bottom: 1px solid rgba(29,28,25,0.12);
            }
            .cta-band h2#cta-band-title {
              font-size: clamp(26px, 3vw, 36px); line-height: 1.15;
              max-width: 22ch; margin: 0 auto 30px; text-wrap: balance;
            }
            .cta-band .pill {
              display: inline-block; border-radius: 999px; text-decoration: none;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.01em; font-size: 14.5px;
              padding: 13px 28px; background: #141311; color: #f0ede6;
              transition: transform 0.15s ease;
            }
            .cta-band .pill:hover { transform: scale(1.03); }
            .cta-band .pill:focus-visible { outline: 2px solid #1d1c19; outline-offset: 3px; }
            @media (prefers-reduced-motion: reduce) {
              .cta-band .pill { transition: none; }
            }
          `,
        }}
      />
      <div className="cta-band-inner">
        <h2 id="cta-band-title">{t("title")}</h2>
        <Link
          className="pill"
          href="/request-access"
          data-umami-event="request-early-access"
          data-umami-event-placement="closing-band"
        >
          {nav("download")}
        </Link>
      </div>
    </section>
  );
}
