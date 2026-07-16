import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TruleafWordmark from "@/components/TruleafWordmark";
import { Link } from "@/lib/navigation";
import { locales } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

type Stat = { n: string; l: string };
type Block = { t: string; d: string };
type Case = {
  id: string;
  name: string;
  role: string;
  sector: string;
  url: string;
  logo: "truleaf" | "micoo";
  lede: string;
  stats: Stat[];
  blocks: Block[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "showcases" });

  const url = `https://trytoone.com/${locale}/showcases`;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `https://trytoone.com/${l}/showcases`;
  }
  languages["x-default"] = "https://trytoone.com/en/showcases";

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: url, languages },
    // Without this the page inherits the root card, whose og:url points at the
    // landing page rather than at the URL actually being shared.
    openGraph: {
      type: "website",
      url,
      title: t("metaTitle"),
      description: t("metaDescription"),
      siteName: "Toone",
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-og.png",
          width: 2400,
          height: 1260,
          alt: "Toone: AI teams that run your work",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: ["https://trytoone.com/assets/og/toone-twitter.png"],
    },
  };
}

export default async function ShowcasesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "showcases" });
  const cases = t.raw("cases") as Case[];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .sc-page { max-width: 980px; margin: 0 auto; padding: 130px 24px 120px; }
            .sc-head { text-align: center; margin-bottom: 76px; }
            .sc-eyebrow {
              color: rgba(255,255,255,0.3); font-size: 11.5px; font-weight: 600;
              letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px;
            }
            .sc-head h1 {
              color: rgba(255,255,255,0.94); font-size: 38px; font-weight: 600;
              letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 16px;
            }
            .sc-head p {
              color: rgba(255,255,255,0.44); font-size: 16px; line-height: 1.65;
              max-width: 60ch; margin: 0 auto;
            }

            .sc-case {
              border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
              background: rgba(255,255,255,0.025); padding: 40px 38px;
              margin-bottom: 26px;
            }
            .sc-top {
              display: flex; align-items: center; gap: 16px;
              flex-wrap: wrap; margin-bottom: 20px;
            }
            .sc-name {
              color: rgba(255,255,255,0.94); font-size: 25px; font-weight: 600;
              letter-spacing: -0.015em; text-decoration: none;
            }
            a.sc-name:hover { color: #fff; }
            .sc-role {
              font-size: 10.5px; font-weight: 700; letter-spacing: 0.11em;
              text-transform: uppercase; color: rgba(199,199,199,0.75);
              border: 1px solid rgba(199,199,199,0.25); border-radius: 100px;
              padding: 5px 11px;
            }
            .sc-sector {
              color: rgba(255,255,255,0.33); font-size: 13px; margin-left: auto;
            }
            .sc-lede {
              color: rgba(255,255,255,0.55); font-size: 15.5px; line-height: 1.7;
              max-width: 76ch; margin-bottom: 30px;
            }

            .sc-stats {
              display: flex; gap: 46px; flex-wrap: wrap;
              padding: 22px 0 26px; margin-bottom: 30px;
              border-top: 1px solid rgba(255,255,255,0.07);
              border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .sc-stat .n {
              color: #C7C7C7; font-size: 28px; font-weight: 600;
              letter-spacing: -0.02em; line-height: 1.1;
            }
            .sc-stat .l {
              color: rgba(255,255,255,0.35); font-size: 12.5px; margin-top: 5px;
            }

            .sc-blocks-label {
              color: rgba(255,255,255,0.3); font-size: 11px; font-weight: 600;
              letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 18px;
            }
            .sc-blocks {
              display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 16px;
            }
            .sc-block {
              background: rgba(255,255,255,0.035);
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 12px; padding: 20px 20px;
            }
            .sc-block h3 {
              color: rgba(255,255,255,0.88); font-size: 14.5px; font-weight: 600;
              margin-bottom: 8px; letter-spacing: -0.005em;
            }
            .sc-block p {
              color: rgba(255,255,255,0.42); font-size: 13.5px; line-height: 1.62;
            }

            /* Brand moment: the mark + Toone's pixel wordmark, lit by the
               lantern gradient. The plain bordered box that was here read as
               dead space at the end of the page. */
            .sc-cta {
              position: relative; overflow: hidden;
              text-align: center; margin-top: 76px; padding: 58px 30px 52px;
              border: 1px solid rgba(255,255,255,0.09); border-radius: 18px;
              background:
                radial-gradient(ellipse 80% 120% at 50% 0%,
                  rgba(199,199,199,0.10) 0%, rgba(199,199,199,0.03) 45%, transparent 72%),
                linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012));
            }
            .sc-lockup {
              display: flex; align-items: center; justify-content: center;
              gap: 14px; margin-bottom: 26px;
            }
            .sc-lockup img { display: block; }
            .sc-wordmark {
              font-family: var(--font-pixel), 'Courier New', monospace;
              font-size: 30px; line-height: 1;
              letter-spacing: 0.06em;
              background: linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 45%, #9A9A9A 100%);
              -webkit-background-clip: text; background-clip: text;
              -webkit-text-fill-color: transparent; color: transparent;
            }
            .sc-cta h2 {
              color: rgba(255,255,255,0.94); font-size: 26px; font-weight: 600;
              letter-spacing: -0.02em; margin-bottom: 12px;
            }
            .sc-cta p {
              color: rgba(255,255,255,0.42); font-size: 15px; line-height: 1.65;
              max-width: 54ch; margin: 0 auto 28px;
            }
            .sc-btn {
              display: inline-block; padding: 14px 30px; border-radius: 12px;
              background: rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.14);
              color: rgba(255,255,255,0.9); text-decoration: none;
              font-size: 14px; font-weight: 500;
              transition: background 0.2s, border-color 0.2s;
            }
            .sc-btn:hover {
              background: rgba(255,255,255,0.14);
              border-color: rgba(255,255,255,0.28);
            }
            .sc-back {
              display: inline-block; margin-top: 40px;
              color: rgba(255,255,255,0.3); font-size: 13px; text-decoration: none;
            }
            .sc-back:hover { color: rgba(255,255,255,0.6); }
            .sc-note {
              text-align: center; color: rgba(255,255,255,0.2);
              font-size: 12px; margin-top: 44px; line-height: 1.6;
            }

            @media (max-width: 640px) {
              .sc-page { padding: 100px 18px 80px; }
              .sc-case { padding: 28px 22px; }
              .sc-sector { margin-left: 0; width: 100%; }
              .sc-stats { gap: 28px; }
            }
          `,
        }}
      />

      <Navigation />

      <div className="sc-page">
        <header className="sc-head">
          <p className="sc-eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("sub")}</p>
        </header>

        {cases.map((c) => (
          <article className="sc-case" key={c.id}>
            <div className="sc-top">
              {c.logo === "truleaf" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/assets/partners/truleaf-icon.svg"
                  alt=""
                  width={38}
                  height={38}
                  style={{ borderRadius: 8, display: "block" }}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/assets/partners/micoo-wordmark.svg"
                  alt=""
                  style={{ height: 24, width: "auto", display: "block" }}
                />
              )}

              {c.logo === "truleaf" && (
                <a
                  className="sc-name"
                  href={c.url}
                  target="_blank"
                  rel="noopener"
                  data-umami-event="showcase-partner-click"
                  data-umami-event-partner={c.id}
                  aria-label={c.name}
                >
                  <TruleafWordmark size={25} />
                </a>
              )}

              <span className="sc-role">{c.role}</span>
              <span className="sc-sector">{c.sector}</span>
            </div>

            <p className="sc-lede">{c.lede}</p>

            <div className="sc-stats">
              {c.stats.map((s) => (
                <div className="sc-stat" key={s.l}>
                  <div className="n">{s.n}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>

            <p className="sc-blocks-label">{t("processesLabel")}</p>
            <div className="sc-blocks">
              {c.blocks.map((b) => (
                <div className="sc-block" key={b.t}>
                  <h3>{b.t}</h3>
                  <p>{b.d}</p>
                </div>
              ))}
            </div>
          </article>
        ))}

        <section className="sc-cta">
          <div className="sc-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={44} height={44} />
            <span className="sc-wordmark">toone</span>
          </div>
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaSub")}</p>
          <a
            className="sc-btn"
            href="mailto:hello@trytoone.com"
            data-umami-event="showcase-bring-us-your-org"
          >
            {t("ctaBtn")}
          </a>
          <div>
            <Link className="sc-back" href="/">
              {t("backHome")}
            </Link>
          </div>
        </section>

        <p className="sc-note">{t("note")}</p>
      </div>

      <Footer />
    </>
  );
}
