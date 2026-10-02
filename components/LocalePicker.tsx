"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/lib/navigation";
import { locales } from "@/i18n/routing";
import {
  LOCALE_COPY,
  isLocale,
  localeHref,
  readAlternates,
  rememberLocaleChoice,
} from "@/lib/locale-preference";

/**
 * Language picker for the header and footer. Each language links to this
 * page's hreflang alternate when it has one, else to that language's home,
 * and remembers the choice (localStorage + next-intl's NEXT_LOCALE cookie).
 * Full page loads on purpose: the server renders the new language.
 */
type Props = {
  variant: "header" | "footer";
};

export default function LocalePicker({ variant }: Props) {
  const current = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [alternates, setAlternates] = useState<ReturnType<typeof readAlternates>>({});
  const root = useRef<HTMLDivElement>(null);

  // Re-read after each navigation; metadata can arrive a beat after render.
  useEffect(() => {
    const read = () => setAlternates(readAlternates(document, window.location.origin));
    read();
    const timer = window.setTimeout(read, 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isLocale(current)) return null;
  const copy = LOCALE_COPY[current];

  return (
    <div className={`lp lp-${variant}`} ref={root}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lp { position: relative; display: inline-flex; }
            .lp-btn {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 6px 2px; border: 0; background: none; cursor: pointer;
              color: inherit; font: inherit; font-size: 14px; font-weight: 500;
            }
            .lp-btn:hover { opacity: 0.75; }
            .lp-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; border-radius: 6px; }
            .lp-btn svg { width: 16px; height: 16px; flex: none; }
            .lp-menu {
              position: absolute; z-index: 60; min-width: 180px; margin: 0; padding: 6px;
              list-style: none; background: #f0ede6; border-radius: 12px;
              box-shadow: 0 14px 40px rgba(0,0,0,0.32);
            }
            .lp-header .lp-menu { top: calc(100% + 10px); right: 0; }
            .lp-footer .lp-menu { bottom: calc(100% + 8px); left: 0; }
            /* Out-specifies host link styles (e.g. .hdr2 .links a:not(.dl)). */
            .lp ul.lp-menu a.lp-item {
              display: flex; justify-content: space-between; gap: 16px;
              padding: 8px 10px; border-radius: 8px;
              color: #1d1c19; text-decoration: none; font-size: 14px; font-weight: 500;
            }
            .lp ul.lp-menu a.lp-item:hover, .lp ul.lp-menu a.lp-item:focus-visible { background: rgba(29,28,25,0.08); outline: none; opacity: 1; }
            .lp ul.lp-menu a.lp-item[aria-current="true"] { font-weight: 600; }
            .lp-menu .lp-code { color: rgba(29,28,25,0.45); font-size: 12px; text-transform: uppercase; }
            .lp-footer .lp-btn { font-size: 13.5px; color: rgba(255,255,255,0.62); padding: 0; }
            .lp-footer .lp-btn:hover { color: rgba(255,255,255,0.95); opacity: 1; }
            @media (max-width: 720px) {
              .lp-header .lp-name { display: none; }
            }
          `,
        }}
      />
      <button
        type="button"
        className="lp-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${copy.label}: ${copy.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className="lp-name">{variant === "header" ? current.toUpperCase() : copy.name}</span>
      </button>
      {open && (
        <ul className="lp-menu" role="list">
          {locales.map((locale) => (
            <li key={locale}>
              <a
                className="lp-item"
                href={localeHref(locale, alternates)}
                hrefLang={locale}
                lang={locale}
                aria-current={locale === current ? "true" : undefined}
                onClick={() => rememberLocaleChoice(locale)}
              >
                <span>{LOCALE_COPY[locale].name}</span>
                <span className="lp-code">{locale}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
