"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/lib/navigation";
import type { Locale } from "@/i18n/routing";
import {
  LOCALE_COPY,
  isLocale,
  localeAction,
  readAlternates,
  rememberLocaleChoice,
  savedLocaleChoice,
} from "@/lib/locale-preference";

/**
 * Offers the visitor's browser language when this page exists in it, in that
 * language ("Voir en français"), and sends a returning visitor who chose a
 * language back to it when they arrive from outside the site. Client-only, so
 * crawlers and the root's permanent redirect are untouched. Sits above the
 * privacy panel while that panel is open.
 */
export default function LocaleSuggestion() {
  const current = useLocale();
  const pathname = usePathname();
  const [offer, setOffer] = useState<{ locale: Locale; href: string } | null>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (!isLocale(current)) return;
    const decide = () => {
      let enteredFromOutside = true;
      try {
        enteredFromOutside = !document.referrer || new URL(document.referrer).origin !== window.location.origin;
      } catch {
        // Unparseable referrer: treat as outside.
      }
      const action = localeAction({
        current,
        languages: navigator.languages?.length ? navigator.languages : [navigator.language],
        saved: savedLocaleChoice(),
        alternates: readAlternates(document, window.location.origin),
        enteredFromOutside,
      });
      if (action.kind === "redirect") {
        window.location.replace(action.href);
      } else {
        setOffer(action.kind === "suggest" ? { locale: action.locale, href: action.href } : null);
      }
    };
    // Metadata (hreflang) can stream in just after hydration.
    const timer = window.setTimeout(decide, 400);
    return () => window.clearTimeout(timer);
  }, [current, pathname]);

  // Stay clear of the privacy panel (bottom-centred) while it is open.
  useEffect(() => {
    if (!offer) return;
    const measure = () => {
      const panel = document.querySelector<HTMLElement>("[data-privacy-panel]");
      setLift(panel ? panel.getBoundingClientRect().height + 12 : 0);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [offer]);

  if (!offer || !isLocale(current)) return null;
  const copy = LOCALE_COPY[offer.locale];

  return (
    <aside
      className="lsg"
      lang={offer.locale}
      aria-label={copy.label}
      data-locale-suggestion={offer.locale}
      style={{ bottom: `calc(max(16px, env(safe-area-inset-bottom)) + ${lift}px)` }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lsg {
              position: fixed; z-index: 1001;
              right: max(16px, env(safe-area-inset-right));
              width: min(calc(100% - 32px), 340px);
              padding: 14px 16px;
              display: flex; flex-direction: column; gap: 10px;
              color: #f0ede6; background: #1c1c1a;
              border: 1px solid rgba(255,255,255,0.23); border-radius: 14px;
              box-shadow: 0 18px 50px rgba(0,0,0,0.28);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
              transition: bottom 0.25s ease;
            }
            .lsg p { margin: 0; font-size: 14px; line-height: 1.4; }
            .lsg-actions { display: flex; gap: 8px; justify-content: flex-end; }
            .lsg-actions a, .lsg-actions button {
              padding: 8px 14px; border-radius: 999px; font: inherit; font-size: 13px; font-weight: 600;
              cursor: pointer; text-decoration: none;
            }
            .lsg-actions a { background: #f0ede6; color: #1d1c19; border: 0; }
            .lsg-actions button { background: none; color: rgba(240,237,230,0.75); border: 1px solid rgba(255,255,255,0.23); }
            .lsg-actions button:hover { color: #f0ede6; }
            @media (max-width: 640px) {
              .lsg { left: max(16px, env(safe-area-inset-left)); width: auto; }
            }
          `,
        }}
      />
      <p>{copy.available}</p>
      <div className="lsg-actions">
        <button
          type="button"
          onClick={() => {
            // Staying is a choice too: never ask again on this browser.
            rememberLocaleChoice(current);
            setOffer(null);
          }}
        >
          {copy.dismiss}
        </button>
        <a href={offer.href} hrefLang={offer.locale} onClick={() => rememberLocaleChoice(offer.locale)}>
          {copy.cta}
        </a>
      </div>
    </aside>
  );
}
