"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link, useRouter } from "@/lib/navigation";
import { announcements, type Announcement } from "@/content/announcements";

const STORAGE_PREFIX = "toone.announcement.dismissed.";

/** The first announcement whose window contains `now`. */
export function activeAnnouncement(now: number, list: Announcement[] = announcements): Announcement | null {
  return list.find(item => {
    const start = Date.parse(item.startsAt);
    const end = Date.parse(item.endsAt);
    return !Number.isNaN(start) && !Number.isNaN(end) && start <= now && now <= end;
  }) ?? null;
}

/**
 * True on a real Mac. Chromium reports the platform directly; Safari and
 * Firefox need the user agent. iPads call themselves Macs in Safari, so a
 * touch screen rules them out.
 */
export function isMacDesktop(): boolean {
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (data?.platform) return data.platform === "macOS";
  return /Macintosh|Mac OS X/.test(navigator.userAgent) && navigator.maxTouchPoints <= 1;
}

/** Scrolls to and focuses the early-access email field when the page has one. */
export function focusEarlyAccessInput(): boolean {
  const input = document.querySelector<HTMLInputElement>("[data-early-access-input]");
  if (!input) return false;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => input.focus({ preventScroll: true }), 350);
  return true;
}

function isDismissed(id: string) {
  try { return window.localStorage.getItem(STORAGE_PREFIX + id) === "1"; } catch { return false; }
}

function remember(id: string) {
  try { window.localStorage.setItem(STORAGE_PREFIX + id, "1"); } catch { /* private mode: show again next visit */ }
}

/** Whole calendar days between today and the end date, in the visitor's timezone. */
function daysLeft(endsAt: string, now: number) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const end = new Date(endsAt); end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86_400_000));
}

function track(event: string) {
  (window as unknown as { umami?: { track: (name: string) => void } }).umami?.track(event);
}

/**
 * AnnouncementModal — a campaign notice shown once per device on the public
 * pages, driven entirely by content/announcements.ts. It follows the landing
 * design language (dark ground, hairline borders, cream primary button) and
 * the ContactModal overlay behaviour: Escape and backdrop close it, and the
 * page behind does not scroll.
 */
export default function AnnouncementModal() {
  const pathname = usePathname();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [mac, setMac] = useState(true);
  const [copied, setCopied] = useState(false);
  const isPublicPage = !/\/(admin|signin|signup)(\/|$)/.test(pathname ?? "");

  useEffect(() => {
    if (!isPublicPage) return;
    // ?preview-announcement=mac|other shows the card again, in that variant, for design review.
    const preview = new URLSearchParams(window.location.search).get("preview-announcement");
    const now = Date.now();
    const active = activeAnnouncement(now);
    if (!active || (isDismissed(active.id) && !preview)) return;
    const onMac = preview ? preview === "mac" : isMacDesktop();
    // A beat after paint so the page settles before the card rises.
    const timer = window.setTimeout(() => {
      setMac(onMac); setAnnouncement(active);
      track(`announcement-open-${active.id}-${onMac ? "mac" : "other"}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isPublicPage]);

  const close = useCallback((reason: "dismiss" | "cta" | "notify" | "close") => {
    if (!announcement) return;
    remember(announcement.id);
    track(`announcement-${reason}-${announcement.id}`);
    setAnnouncement(null);
  }, [announcement]);

  /** Non-Mac path: close the card and hand the visitor the early-access email field. */
  function notifyMe() {
    close("notify");
    if (focusEarlyAccessInput()) return;
    // Pages without the hero form: the request page focuses its field on #notify.
    router.push("/request-access#notify");
  }

  useEffect(() => {
    if (!announcement) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close("close"); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [announcement, close]);

  if (!announcement) return null;
  const other = announcement.otherPlatforms;
  const left = daysLeft(announcement.endsAt, Date.now());
  const deadline = new Date(announcement.endsAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  async function copyCode() {
    if (!announcement?.code) return;
    try { await navigator.clipboard.writeText(announcement.code); setCopied(true); track(`announcement-copy-${announcement.id}`); window.setTimeout(() => setCopied(false), 1800); }
    catch { /* the code is visible and selectable */ }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
              display: flex; align-items: flex-end;
            }
            @keyframes an-rise {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to { opacity: 1; transform: none; }
            }
            .an-image {
              position: absolute; inset: 0; width: 100%; height: 100%;
              object-fit: cover; object-position: center; z-index: -2;
              transform: scale(1.02); animation: an-drift 14s ease-in-out infinite alternate;
            }
            @keyframes an-drift { from { transform: scale(1.02) translateX(0); } to { transform: scale(1.06) translateX(-1.5%); } }
            .an-shade {
              position: absolute; inset: 0; z-index: -1;
              background:
                linear-gradient(90deg, rgba(20,20,19,0.94) 0%, rgba(20,20,19,0.82) 38%, rgba(20,20,19,0.35) 68%, rgba(20,20,19,0.08) 100%),
                linear-gradient(0deg, rgba(20,20,19,0.85) 0%, rgba(20,20,19,0.2) 45%, rgba(20,20,19,0) 100%);
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
              padding: 44px 48px 40px; display: flex; flex-direction: column; gap: 14px;
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
              .an-card { aspect-ratio: auto; min-height: min(78svh, 640px); border-radius: 18px; }
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
          `,
        }}
      />
      <div className="an-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close("close"); }}>
        <div className="an-card" role="dialog" aria-modal="true" aria-labelledby="an-title">
          <img className="an-image" src={announcement.image} alt={announcement.imageAlt ?? ""} />
          <div className="an-shade" aria-hidden="true" />
          <button type="button" className="an-close" onClick={() => close("close")} aria-label="Close">×</button>
          <div className="an-body">
            {mac ? <>
            <p className="an-eyebrow">{announcement.eyebrow}</p>
            <h2 id="an-title" className="an-title">{announcement.title}</h2>
            <p className="an-text">{announcement.body}</p>
            {announcement.code && (
              <div className="an-code">
                <div>
                  <p className="an-code-label">Your code</p>
                  <p className="an-code-value">{announcement.code}</p>
                </div>
                <button type="button" className="an-copy" onClick={() => void copyCode()} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
              </div>
            )}
            <p className="an-deadline">Valid until <strong>{deadline}</strong>{left > 0 ? ` · ${left} ${left === 1 ? "day" : "days"} left` : " · last day"}</p>
            <div className="an-actions">
              <Link href={announcement.cta.href} className="an-primary" onClick={() => close("cta")}>{announcement.cta.label}</Link>
              <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{announcement.dismissLabel}</button>
            </div>
            </> : <>
            <p className="an-eyebrow">{other.eyebrow}</p>
            <h2 id="an-title" className="an-title">{other.title}</h2>
            <p className="an-text">{other.body}</p>
            <div className="an-actions">
              <button type="button" className="an-primary" onClick={notifyMe}>{other.ctaLabel}</button>
              <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{other.dismissLabel}</button>
            </div>
            </>}
          </div>
        </div>
      </div>
    </>
  );
}
