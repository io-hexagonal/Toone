"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

const DMG_URL =
  "https://github.com/io-hexagonal/Toone/releases/latest/download/Toone.dmg";

/**
 * Site footer — dark ground closing the dark–cream–dark rhythm.
 * Brand lockup + legal on the left, three link columns on the right.
 * Anchor links go through "/" so they work from any page.
 */
export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

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
            .ftr-legal { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.32); }
            .ftr-cols { display: flex; gap: 64px; flex-wrap: wrap; }
            .ftr-cols h4 {
              font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em;
              text-transform: uppercase; color: rgba(255,255,255,0.35);
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
              <h4>{t("product")}</h4>
              <Link href="/#how">{t("how")}</Link>
              <Link href="/#faq">FAQ</Link>
              <a
                href={DMG_URL}
                data-umami-event="download-dmg"
                data-umami-event-placement="footer"
              >
                {nav("download")}
              </a>
            </div>
            <div>
              <h4>{t("proof")}</h4>
              <Link href="/showcases">{nav("showcases")}</Link>
            </div>
            <div>
              <h4>{t("company")}</h4>
              <a href="mailto:hello@trytoone.com">{t("contact")}</a>
              <Link href="/privacy">{t("privacy")}</Link>
              <a href="https://github.com/mattwebhub/toone" target="_blank" rel="noopener">
                {nav("github")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
