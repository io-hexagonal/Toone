import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

/**
 * Site footer — dark ground closing the dark–cream–dark rhythm.
 * Brand lockup + legal on the left, three link columns on the right.
 * Anchor links return to the active Personal or Business landing route.
 */
type Props = {
  landingPath?: "/" | "/business";
};

export default async function Footer({ landingPath = "/" }: Props) {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ftr {
              position: relative; z-index: 5;
              background: #141413; color: rgba(255,255,255,0.55);
              border-top: 1px solid rgba(255,255,255,0.08);
              padding: 60px 24px 72px;
            }
            .ftr-wrap {
              max-width: 1080px; margin: 0 auto;
              display: flex; justify-content: space-between; gap: 48px; flex-wrap: wrap;
            }
            .ftr-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
            .ftr-brand img { width: 26px; height: 26px; display: block; }
            .ftr-brand .wm {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
              color: rgba(255,255,255,0.92); font-size: 19px;
            }
            .ftr-legal { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.64); }
            .ftr-cols { display: flex; gap: 64px; flex-wrap: wrap; }
            .ftr-heading {
              font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em;
              text-transform: uppercase; color: rgba(255,255,255,0.66);
              margin-bottom: 14px;
            }
            .ftr-cols a {
              display: block; color: rgba(255,255,255,0.62); text-decoration: none;
              font-size: 13.5px; margin-bottom: 9px; transition: color 0.2s;
            }
            .ftr-cols a:hover { color: rgba(255,255,255,0.95); }
            @media (max-width: 640px) {
              .ftr-wrap { flex-direction: column; }
              .ftr-cols { gap: 40px; }
              .ftr-download { display: none !important; }
            }
          `,
        }}
      />
      <footer className="ftr">
        <div className="ftr-wrap">
          <div>
            <Link href="/" aria-label="Toone" className="ftr-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/brand/toone-mark.svg" alt="" />
              <span className="wm">toone</span>
            </Link>
            <div className="ftr-legal">
              © {new Date().getFullYear()} Toone — {t("rights")}
            </div>
          </div>
          <div className="ftr-cols">
            <div>
              <p className="ftr-heading">{t("product")}</p>
              <Link href={`${landingPath}#how`}>{t("how")}</Link>
              <Link href={`${landingPath}#faq`}>FAQ</Link>
              <Link
                className="ftr-download"
                href="/download"
                data-umami-event="open-download-chooser"
                data-umami-event-placement="footer"
              >
                {nav("download")}
              </Link>
            </div>
            <div>
              <p className="ftr-heading">{t("proof")}</p>
              <Link href="/resources">{nav("resources")}</Link>
              <a href="/en/governance">{nav("governance")}</a>
              <Link href="/showcases">{nav("showcases")}</Link>
            </div>
            <div>
              <p className="ftr-heading">{t("company")}</p>
              <Link href="/about">{t("about")}</Link>
              <Link href="/editorial-policy">{t("editorialPolicy")}</Link>
              <Link href="/signin">{nav("signin")}</Link>
              <Link href="/contact">{t("contact")}</Link>
              <Link href="/privacy">{t("privacy")}</Link>
              <a href="https://github.com/io-hexagonal/Toone" target="_blank" rel="noopener">
                {nav("github")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
