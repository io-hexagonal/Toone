"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

/**
 * Morphing landing header — one element, two states.
 *
 * Over the hero it is a flat full-width bar (big lockup, content inset 10vw
 * per side). Past the hero it shrinks into the glassy cream pill. The same
 * DOM nodes stay put and every property tweens, so the elements visibly
 * "stay" while the chrome contracts around them.
 */
export default function SiteHeader() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setScrolled(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hdr2 {
              position: fixed; z-index: 40;
              top: 0; left: 50%; transform: translateX(-50%);
              width: 100%;
              display: flex; align-items: center; gap: 28px;
              padding: 24px 10vw;
              background-color: rgba(240, 237, 230, 0);
              border-radius: 0;
              -webkit-backdrop-filter: blur(0px); backdrop-filter: blur(0px);
              transition:
                width 0.5s cubic-bezier(0.22, 0.8, 0.36, 1),
                top 0.5s cubic-bezier(0.22, 0.8, 0.36, 1),
                padding 0.5s cubic-bezier(0.22, 0.8, 0.36, 1),
                border-radius 0.5s cubic-bezier(0.22, 0.8, 0.36, 1),
                background-color 0.4s ease,
                box-shadow 0.4s ease;
            }
            .hdr2[data-scrolled="true"] {
              top: 14px;
              width: min(1080px, calc(100vw - 32px));
              padding: 10px 14px 10px 22px;
              border-radius: 999px;
              background-color: rgba(240, 237, 230, 0.94);
              -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28);
            }

            .hdr2 .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
            .hdr2 .mark { position: relative; width: 34px; height: 34px; transition: width 0.5s cubic-bezier(0.22,0.8,0.36,1), height 0.5s cubic-bezier(0.22,0.8,0.36,1); }
            .hdr2[data-scrolled="true"] .mark { width: 27px; height: 27px; }
            .hdr2 .mark img {
              position: absolute; inset: 0; width: 100%; height: 100%;
              transition: opacity 0.4s ease;
            }
            .hdr2 .mark .on-light { opacity: 0; }
            .hdr2[data-scrolled="true"] .mark .on-dark { opacity: 0; }
            .hdr2[data-scrolled="true"] .mark .on-light { opacity: 1; }

            .hdr2 .wm {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
              color: rgba(255,255,255,0.92); font-size: 21px;
              transition: color 0.4s ease, font-size 0.5s cubic-bezier(0.22,0.8,0.36,1);
            }
            .hdr2[data-scrolled="true"] .wm { color: #1d1c19; font-size: 18.5px; }

            .hdr2 .links { display: flex; align-items: center; gap: 26px; margin-left: auto; }
            .hdr2 .links a:not(.dl) {
              color: rgba(255,255,255,0.62); text-decoration: none;
              font-size: 14.5px; font-weight: 500;
              transition: color 0.4s ease, opacity 0.2s ease;
            }
            .hdr2 .links a:not(.dl):hover { opacity: 0.75; }
            .hdr2[data-scrolled="true"] .links a:not(.dl) { color: #1d1c19; }

            .hdr2 .dl {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.01em; font-size: 14.5px;
              border-radius: 999px; padding: 11px 24px; text-decoration: none;
              background: #f0ede6; color: #1d1c19;
              transition: background-color 0.4s ease, color 0.4s ease, transform 0.15s ease;
            }
            .hdr2 .dl:hover { transform: scale(1.03); }
            .hdr2[data-scrolled="true"] .dl { background: #141311; color: #f0ede6; }

            @media (max-width: 720px) {
              .hdr2 { padding: 16px 20px; gap: 14px; }
              .hdr2 .links { gap: 16px; }
              .hdr2 .links a[data-optional],
              .hdr2 .links .dl { display: none; }
            }
          `,
        }}
      />

      <header className="hdr2" data-scrolled={scrolled}>
        <Link href="/" aria-label="Toone" className="brand">
          <span className="mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="on-dark" src="/assets/brand/toone-mark.svg" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="on-light" src="/assets/brand/toone-mark-light.svg" alt="" />
          </span>
          <span className="wm">toone</span>
        </Link>
        <nav className="links" aria-label="Primary">
          <Link href="/showcases" data-optional>{t("showcases")}</Link>
          <Link href="/privacy" data-optional>{t("privacy")}</Link>
          <a href="https://github.com/mattwebhub/toone" target="_blank" rel="noopener" data-optional>
            {t("github")}
          </a>
          <Link href="/signin">{t("signin")}</Link>
          <Link
            className="dl"
            href="/download"
            data-umami-event="open-download-chooser"
            data-umami-event-placement="header"
          >
            {t("download")}
          </Link>
        </nav>
      </header>
    </>
  );
}
