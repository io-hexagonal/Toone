"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { announcements, type Announcement } from "@/content/announcements";
import { activeAnnouncement, isMacDesktop, rememberDismissal, track, wasDismissed } from "@/lib/announcements";
import AccessCodeCard from "./AccessCodeCard";

export type Platform = "mac" | "other";
export type CloseReason = "dismiss" | "cta" | "notify" | "close";

/** What every card component receives from the shell. */
export type CardProps<A extends Announcement = Announcement> = {
  announcement: A;
  platform: Platform;
  close: (reason: CloseReason) => void;
};

/** One card component per announcement kind; add new kinds here and in content/announcements/types.ts. */
const cards: { [K in Announcement["kind"]]: ComponentType<CardProps<Extract<Announcement, { kind: K }>>> } = {
  "access-code": AccessCodeCard,
};

/**
 * AnnouncementModal — the shell that decides whether an announcement shows on
 * this page for this visitor (time window, routes, repeat rule), then renders
 * the card for its kind over the campaign image. It follows the landing design
 * language (dark ground, hairline borders, cream primary button) and the
 * ContactModal overlay behaviour: Escape and backdrop close it, and the page
 * behind does not scroll.
 *
 * Preview: append ?preview-announcement=mac or =other to any public page to
 * force that variant and ignore an earlier dismissal.
 */
export default function AnnouncementModal() {
  const pathname = usePathname() ?? "/";
  const [current, setCurrent] = useState<{ announcement: Announcement; platform: Platform } | null>(null);
  const isPublicPage = !/\/(admin|signin|signup)(\/|$)/.test(pathname);

  useEffect(() => {
    if (!isPublicPage) return;
    const preview = new URLSearchParams(window.location.search).get("preview-announcement");
    const active = activeAnnouncement(announcements, Date.now(), pathname);
    if (!active || (wasDismissed(active) && !preview)) return;
    const platform: Platform = preview ? (preview === "mac" ? "mac" : "other") : isMacDesktop() ? "mac" : "other";
    // A beat after paint so the page settles before the card rises.
    const timer = window.setTimeout(() => {
      setCurrent({ announcement: active, platform });
      track(`announcement-open-${active.id}-${platform}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isPublicPage, pathname]);

  const close = useCallback((reason: CloseReason) => {
    setCurrent(shown => {
      if (shown) {
        rememberDismissal(shown.announcement);
        track(`announcement-${reason}-${shown.announcement.id}`);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close("close"); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [current, close]);

  if (!current) return null;
  const { announcement, platform } = current;
  const Card = cards[announcement.kind] as ComponentType<CardProps>;
  const framing = announcement.image.framing;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="an-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close("close"); }}>
        <div className="an-card" role="dialog" aria-modal="true" aria-labelledby="an-title">
          <img
            className="an-image"
            src={announcement.image.src}
            alt={announcement.image.alt ?? ""}
            data-anchor={framing?.anchor ?? "center"}
            style={{ "--an-scale": framing?.scale ?? 1 } as React.CSSProperties}
          />
          <div className="an-shade" aria-hidden="true" />
          <button type="button" className="an-close" onClick={() => close("close")} aria-label="Close">×</button>
          <div className="an-body">
            <div className="an-brand" aria-hidden="true">
              <img src="/assets/brand/toone-mark.svg" alt="" />
              <span>toone</span>
            </div>
            <Card announcement={announcement} platform={platform} close={close} />
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .an-overlay {
    position: fixed; inset: 0; z-index: 90;
    background: rgba(10,10,9,0.78);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; animation: an-fade 0.22s ease;
  }
  @keyframes an-fade { from { opacity: 0; } to { opacity: 1; } }
  .an-card {
    position: relative; width: 100%; max-width: 980px; aspect-ratio: 16 / 9;
    min-height: 420px; max-height: calc(100svh - 48px);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 22px;
    background: #1b1b19; overflow: hidden; isolation: isolate;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
    animation: an-rise 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex; align-items: center;
  }
  @keyframes an-rise {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .an-image {
    position: absolute; top: 0; bottom: 0; height: 100%; width: calc(100% * var(--an-scale, 1));
    max-width: none; /* Tailwind preflight caps img at 100%; the framing needs to overflow. */
    object-fit: cover; object-position: center; z-index: -2;
    animation: an-drift 16s ease-in-out infinite alternate;
  }
  .an-image[data-anchor="left"] { left: 0; }
  .an-image[data-anchor="center"] { left: 50%; transform: translateX(-50%); }
  .an-image[data-anchor="right"] { right: 0; }
  @keyframes an-drift { from { scale: 1; } to { scale: 1.04; } }
  .an-shade {
    position: absolute; inset: 0; z-index: -1;
    background:
      linear-gradient(90deg, rgba(20,20,19,0.82) 0%, rgba(20,20,19,0.6) 34%, rgba(20,20,19,0.18) 58%, rgba(20,20,19,0) 80%),
      linear-gradient(0deg, rgba(20,20,19,0.7) 0%, rgba(20,20,19,0.15) 40%, rgba(20,20,19,0) 70%);
  }
  .an-close {
    position: absolute; top: 16px; right: 16px; z-index: 2;
    width: 36px; height: 36px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.16);
    background: rgba(20,20,19,0.55); color: rgba(255,255,255,0.85); cursor: pointer;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    font-size: 20px; line-height: 1; display: grid; place-items: center;
    transition: transform 0.15s ease, background 0.15s ease;
  }
  .an-close:hover { transform: scale(1.06); background: rgba(20,20,19,0.8); }
  .an-body {
    position: relative; z-index: 1; max-width: 480px;
    padding: 40px 48px; display: flex; flex-direction: column; gap: 14px;
  }
  .an-brand { display: flex; align-items: center; gap: 9px; margin: 0 0 6px; }
  .an-brand img { width: 28px; height: 28px; display: block; }
  .an-brand span {
    font-family: var(--font-wordmark), system-ui, sans-serif;
    font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
    color: rgba(255,255,255,0.92); font-size: 19px; line-height: 1;
  }
  .an-eyebrow {
    color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase; margin: 0;
  }
  .an-title {
    color: #f0ede6; font-size: 36px; font-weight: 600;
    letter-spacing: -0.03em; line-height: 1.08; margin: 0;
    text-shadow: 0 2px 24px rgba(0,0,0,0.35);
  }
  .an-text { color: rgba(255,255,255,0.68); font-size: 15px; line-height: 1.6; margin: 0; max-width: 42ch; }
  .an-code {
    display: inline-flex; align-items: center; gap: 14px; align-self: flex-start;
    margin: 6px 0 2px; padding: 10px 10px 10px 16px; border-radius: 12px;
    border: 1px dashed rgba(255,255,255,0.28); background: rgba(20,20,19,0.55);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  .an-code-label { color: rgba(255,255,255,0.45); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 2px; }
  .an-code-value {
    color: #f0ede6; font-size: 19px; font-weight: 600; letter-spacing: 0.1em;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; margin: 0; user-select: all;
  }
  .an-copy {
    flex: none; padding: 9px 13px; border-radius: 9px; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.9); font-size: 12.5px; font-weight: 600; font-family: inherit;
    transition: background 0.15s ease, border-color 0.15s ease; min-width: 76px;
  }
  .an-copy:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.35); }
  .an-deadline { color: rgba(255,255,255,0.5); font-size: 12.5px; margin: 0; }
  .an-deadline strong { color: rgba(255,255,255,0.85); font-weight: 600; }
  .an-actions { display: flex; align-items: center; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
  .an-primary {
    display: inline-block; text-align: center; padding: 13px 26px; border-radius: 10px;
    border: none; cursor: pointer;
    background: #f0ede6; color: #1d1c19; text-decoration: none;
    font-family: var(--font-wordmark), system-ui, sans-serif;
    font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
    transition: transform 0.15s ease;
  }
  .an-primary:hover { transform: scale(1.02); }
  .an-secondary {
    border: none; background: transparent; cursor: pointer; padding: 8px 4px;
    color: rgba(255,255,255,0.55); font-size: 13.5px; font-family: inherit;
  }
  .an-secondary:hover { color: rgba(255,255,255,0.9); }
  @media (max-width: 720px) {
    .an-overlay { padding: 14px; }
    .an-card { aspect-ratio: auto; min-height: min(78svh, 640px); border-radius: 18px; align-items: flex-end; }
    .an-image { width: 100% !important; left: 0 !important; right: auto !important; transform: none !important; object-position: center 30%; }
    .an-shade { background: linear-gradient(0deg, rgba(20,20,19,0.96) 0%, rgba(20,20,19,0.9) 45%, rgba(20,20,19,0.25) 100%); }
    .an-body { padding: 28px 24px 26px; max-width: none; }
    .an-title { font-size: 27px; }
    .an-text { font-size: 14px; }
    .an-code { width: 100%; justify-content: space-between; }
    .an-primary { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .an-overlay, .an-card, .an-image { animation: none; }
  }
`;
