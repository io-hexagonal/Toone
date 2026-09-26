"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type KeyboardEvent, type PointerEvent } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { announcements, type AnnouncementContent } from "@/content/announcements";
import { explorePrereleaseContent } from "@/content/announcements/explore-prerelease";
import { activeAnnouncement, isMacDesktop, rememberDismissal, track, wasDismissed } from "@/lib/announcements";
import { PRIVACY_CHOICE_SAVED_EVENT, savedPrivacyChoice } from "@/lib/privacy-choices";
import AccessCodeCard from "./AccessCodeCard";
import ShowcaseCard from "./ShowcaseCard";

export type Platform = "mac" | "other";
export type CloseReason = "dismiss" | "cta" | "notify" | "close";
export type CardProps<A extends AnnouncementContent = AnnouncementContent> = {
  announcement: A;
  platform: Platform;
  close: (reason: CloseReason) => void;
  /** Absent only for an unscheduled development preview. */
  endsAt?: string;
};

const cards: { [K in AnnouncementContent["kind"]]: ComponentType<CardProps<Extract<AnnouncementContent, { kind: K }>>> } = {
  "access-code": AccessCodeCard,
};

type ShownAnnouncement = Omit<CardProps, "close"> & { preview: boolean };

/**
 * Campaign scheduling and dismissal stay independent from panel navigation.
 * ?preview-announcement=mac (or other) previews the active campaign.
 * In development, add &preview-campaign=explore-prerelease to preview its
 * unscheduled content without inventing a deadline or enabling it publicly.
 */
export default function AnnouncementModal() {
  const pathname = usePathname() ?? "/";
  const [current, setCurrent] = useState<ShownAnnouncement | null>(null);
  const [privacyResolved, setPrivacyResolved] = useState(false);
  const isPublicPage = !/\/(admin|signin|signup)(\/|$)/.test(pathname);

  useEffect(() => {
    const refresh = () => setPrivacyResolved(savedPrivacyChoice() !== null);
    refresh();
    window.addEventListener(PRIVACY_CHOICE_SAVED_EVENT, refresh);
    return () => window.removeEventListener(PRIVACY_CHOICE_SAVED_EVENT, refresh);
  }, []);

  useEffect(() => {
    setCurrent(null);
    if (!isPublicPage || !privacyResolved) return;
    const params = new URLSearchParams(window.location.search);
    const variant = params.get("preview-announcement");
    const preview = variant === "mac" || variant === "other";
    const draft = process.env.NODE_ENV === "development" && preview && params.get("preview-campaign") === "explore-prerelease"
      ? explorePrereleaseContent : null;
    const active = draft ?? activeAnnouncement(announcements, Date.now(), pathname);
    if (!active || (wasDismissed(active) && !preview)) return;
    const platform: Platform = preview ? variant : isMacDesktop() ? "mac" : "other";
    const timer = window.setTimeout(() => {
      setCurrent({ announcement: active, platform, preview, endsAt: "endsAt" in active ? active.endsAt : undefined });
      if (!preview) track(`announcement-open-${active.id}-${platform}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isPublicPage, pathname, privacyResolved]);

  const close = useCallback((reason: CloseReason) => {
    if (!current) return;
    if (!current.preview) {
      rememberDismissal(current.announcement);
      track(`announcement-${reason}-${current.announcement.id}`);
    }
    setCurrent(null);
  }, [current]);

  return current ? <AnnouncementDialog key={`${current.announcement.id}-${current.announcement.version}`} {...current} close={close} /> : null;
}

/** Reusable single-panel or carousel presentation, independent of scheduling. */
export function AnnouncementDialog({ announcement, platform, close, endsAt }: CardProps) {
  const t = useTranslations("announcement");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; axis: "horizontal" | "vertical" | null } | null>(null);
  const suppressClick = useRef(false);
  const panels = announcement.panels ?? [];
  const count = panels.length + 1;
  const multiple = count > 1;
  const panel = index > 0 ? panels[index - 1] : undefined;
  const artwork = panel?.image ?? announcement.image;
  const framing = artwork.framing;
  const introduction = platform === "mac" ? announcement.mac : announcement.otherPlatforms;
  const labels = [introduction.title, ...panels.map(item => item.title)];
  const rotating = multiple && playing && !hovered && visible && !reducedMotion;
  const Card = cards[announcement.kind];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setVisible(document.visibilityState === "visible");
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex(value => (value + 1) % count), Math.max(5_000, announcement.autoAdvanceMs ?? 12_000));
    return () => window.clearTimeout(timer);
  }, [rotating, index, count, announcement.autoAdvanceMs]);

  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [index]);

  useEffect(() => {
    for (const item of panels) {
      const image = new Image();
      image.src = item.image.src;
    }
  }, [announcement.panels]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>(".an-close")?.focus({ preventScroll: true });
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close("close"); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [close]);

  function select(next: number) {
    setPlaying(false);
    // A link inside the outgoing panel is about to unmount; retain focus in the dialog.
    if (scroller.current?.contains(document.activeElement)) carousel.current?.focus({ preventScroll: true });
    setIndex((next + count) % count);
  }

  function onCarouselKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiple || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if ((event.target as HTMLElement).closest("input, textarea, select")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!multiple || !event.isPrimary || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button, input, textarea, select, [contenteditable], .an-code")) return;
    setPlaying(false);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.setPointerCapture(event.pointerId);
    // Touch retains native vertical scrolling; mouse dragging does not select copy.
    if (event.pointerType === "mouse") event.preventDefault();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      if (Math.abs(dy) > Math.abs(dx)) start.axis = "vertical";
      else if (Math.abs(dx) > Math.abs(dy) * 1.3) start.axis = "horizontal";
    }
    if (start.axis !== "horizontal") return;
    event.preventDefault();
    setDragging(true);
    setDragOffset(Math.max(-80, Math.min(80, dx * 0.4)));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    setDragOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    suppressClick.current = !cancelled && start.axis === "horizontal";
    if (!cancelled && start.axis === "horizontal" && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      select(index + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="an-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close("close"); }}>
        <div ref={dialog} className="an-card" role="dialog" aria-modal="true" aria-labelledby="an-title" data-carousel={multiple} data-dragging={dragging}
          style={{ "--an-drag-offset": `${dragOffset}px` } as React.CSSProperties}>
          <img key={artwork.src} className="an-image" src={artwork.src} alt={artwork.alt ?? ""} data-anchor={framing?.anchor ?? "center"}
            draggable={false} style={{ "--an-scale": framing?.scale ?? 1 } as React.CSSProperties} />
          <div className="an-shade" aria-hidden="true" />
          <div className="an-window-controls">
            {multiple && !reducedMotion && <button type="button" className="an-icon-button an-playback" data-carousel-playback onClick={() => setPlaying(value => !value)}
              aria-label={t(playing ? "pauseCarousel" : "playCarousel")}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>}
            <button type="button" className="an-icon-button an-close" onClick={() => close("close")} aria-label={t("close")}>×</button>
          </div>
          <div ref={carousel} className="an-carousel" role={multiple ? "region" : undefined} aria-roledescription={multiple ? "carousel" : undefined}
            aria-label={multiple ? t("carouselLabel") : undefined} tabIndex={-1}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onFocusCapture={() => setPlaying(false)} onKeyDown={onCarouselKey}>
            <div ref={scroller} className="an-scroll" id="an-current-panel" aria-live={rotating ? "off" : "polite"} aria-atomic="true"
              onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)}
              onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => endDrag(event, true)}
              onDragStart={event => event.preventDefault()}
              onClickCapture={event => {
                if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
              }}>
              <div key={panel?.id ?? "invitation"} className={`an-body${panel ? " an-body-showcase" : ""}`} role={multiple ? "group" : undefined}
                aria-roledescription={multiple ? t("panelRole") : undefined} aria-label={multiple ? t("panelPosition", { current: index + 1, total: count }) : undefined}>
                <div className="an-brand" aria-hidden="true"><img src="/assets/brand/toone-mark.svg" alt="" /><span>toone</span></div>
                {panel ? <ShowcaseCard panel={panel} close={close} /> : <Card announcement={announcement} platform={platform} close={close} endsAt={endsAt} />}
              </div>
            </div>
            {multiple && (
              <>
                <button type="button" className="an-arrow an-arrow-previous" onClick={() => select(index - 1)} aria-label={t("previousPanel")} aria-controls="an-current-panel">‹</button>
                <div className="an-indicators" style={{ "--an-active-index": index } as React.CSSProperties}>
                  {labels.map((label, position) => (
                    <button key={position === 0 ? "invitation" : panels[position - 1].id} type="button" className="an-indicator"
                      aria-label={t("goToPanel", { title: label })} aria-current={position === index ? "true" : undefined} aria-controls="an-current-panel"
                      onClick={() => select(position)}><span /></button>
                  ))}
                </div>
                <button type="button" className="an-arrow an-arrow-next" onClick={() => select(index + 1)} aria-label={t("nextPanel")} aria-controls="an-current-panel">›</button>
              </>
            )}
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
    height: min(620px, calc(100svh - 48px)); min-height: 0; max-height: calc(100svh - 48px);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 22px;
    background: #1b1b19; overflow: hidden; isolation: isolate;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
    animation: an-rise 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex; align-items: stretch;
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
  .an-window-controls { position: absolute; top: 16px; right: 16px; z-index: 4; display: flex; align-items: center; gap: 8px; }
  .an-icon-button {
    width: 36px; height: 36px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.16);
    background: rgba(20,20,19,0.55); color: rgba(255,255,255,0.85); cursor: pointer;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    font-size: 20px; line-height: 1; display: grid; place-items: center;
    transition: background 0.15s ease;
  }
  .an-icon-button:hover { background: rgba(20,20,19,0.8); }
  .an-body {
    position: relative; z-index: 1; width: 100%; max-width: 520px;
    padding: 40px 48px 28px; display: flex; flex-direction: column; gap: 14px;
    margin-block: auto; animation: an-panel-in .25s ease;
  }
  @keyframes an-panel-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .an-carousel { position: relative; display: flex; flex-direction: column; width: 100%; min-height: 0; }
  .an-scroll { display: flex; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  .an-card[data-carousel="true"] .an-scroll { margin-bottom: 48px; touch-action: pan-y pinch-zoom; cursor: grab; user-select: none; transform: translateX(var(--an-drag-offset)); transition: transform .18s ease; }
  .an-card[data-dragging="true"] .an-scroll { cursor: grabbing; transition: none; }
  .an-card[data-carousel="true"] .an-body { padding: 56px 64px 12px; }
  .an-code, .an-code * { cursor: auto; user-select: text; }
  .an-card[data-carousel="true"] .an-image { animation: none; }
  .an-body-showcase { max-width: 580px; gap: 12px; }
  .an-body-showcase .an-title { max-width: 12ch; }
  .an-features { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 16px; }
  .an-features li { display: flex; gap: 12px; }
  .an-feature-number { color: rgba(255,255,255,.52); font-size: 11px; padding-top: 3px; font-variant-numeric: tabular-nums; }
  .an-features h3 { margin: 0 0 4px; color: #f0ede6; font-size: 14px; font-weight: 600; line-height: 1.4; }
  .an-features p { margin: 0; color: rgba(255,255,255,.68); font-size: 13px; line-height: 1.5; max-width: 44ch; }
  .an-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; display: grid; place-items: center; width: 32px; height: 56px; padding: 0; border: 0; border-radius: 10px; background: transparent; color: rgba(255,255,255,.42); cursor: pointer; font: inherit; font-size: 32px; line-height: 1; transition: color .15s ease, background .15s ease; }
  .an-arrow-previous { left: 12px; }
  .an-arrow-next { right: 12px; }
  .an-arrow:hover, .an-arrow:focus-visible { color: rgba(255,255,255,.9); background: rgba(20,20,19,.2); }
  .an-playback { font-size: 13px; }
  .an-indicators { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 2; height: 48px; display: flex; align-items: center; justify-content: center; gap: 0; }
  /* The active target grows by the pill's extra width, keeping the visible group centered. */
  .an-indicators::before { content: ""; position: absolute; left: 8.5px; top: 50%; margin-top: -3.5px; width: 23px; height: 7px; border-radius: 20px; background: #f0ede6; pointer-events: none; transform: translateX(calc(var(--an-active-index, 0) * 24px)); transition: transform .32s cubic-bezier(.22, 1, .36, 1); }
  .an-indicator { display: grid; place-items: center; flex: none; width: 24px; height: 32px; padding: 0; border: 0; background: transparent; cursor: pointer; transition: width .32s cubic-bezier(.22, 1, .36, 1); }
  .an-indicator[aria-current="true"] { width: 40px; }
  .an-indicator span { display: block; width: 7px; height: 7px; border-radius: 20px; background: rgba(255,255,255,.35); transition: opacity .2s ease; }
  .an-indicator[aria-current="true"] span { opacity: 0; }
  .an-card button:focus-visible, .an-card a:focus-visible { outline: 2px solid #f0ede6; outline-offset: 4px; }
  .an-carousel:focus { outline: none; }
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
  .an-note { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5; margin: 4px 0 0; max-width: 44ch; }
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
    font-weight: 500; font-size: 14.5px; letter-spacing: -0.01em;
  }
  .an-secondary {
    border: none; background: transparent; cursor: pointer; padding: 8px 4px;
    color: rgba(255,255,255,0.55); font-size: 13.5px; font-family: inherit;
  }
  .an-secondary:hover { color: rgba(255,255,255,0.9); }
  @media (max-width: 720px) {
    .an-overlay { padding: 14px; }
    .an-card { aspect-ratio: auto; height: min(720px, calc(100svh - 28px)); max-height: calc(100svh - 28px); border-radius: 18px; }
    .an-image { width: 100% !important; left: 0 !important; right: auto !important; transform: none !important; object-position: center 30%; }
    .an-shade { background: linear-gradient(0deg, rgba(20,20,19,0.96) 0%, rgba(20,20,19,0.9) 45%, rgba(20,20,19,0.25) 100%); }
    .an-body, .an-card[data-carousel="true"] .an-body { padding: 68px 24px 8px; max-width: none; margin-top: auto; margin-bottom: 0; }
    .an-body-showcase { padding-top: 56px; }
    .an-arrow { display: none; }
    .an-indicators { height: 56px; }
    .an-card[data-carousel="true"] .an-scroll { margin-bottom: 48px; }
    .an-title { font-size: 27px; }
    .an-text { font-size: 14px; }
    .an-code { width: 100%; justify-content: space-between; }
    .an-primary { width: 100%; }
  }
  @media (pointer: coarse) {
    .an-icon-button { width: 44px; height: 44px; }
    .an-indicator { height: 44px; }
    .an-arrow { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .an-overlay, .an-card, .an-image, .an-body { animation: none; }
    .an-indicators::before, .an-indicator, .an-indicator span, .an-card[data-carousel="true"] .an-scroll { transition: none; }
  }
`;
