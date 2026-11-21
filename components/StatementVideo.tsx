"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The product video above the statement block. While the reader scrolls
 * through it, the card grows until it fills the viewport, holds there, then
 * shrinks back. Once half of the card is on screen on the way down, the page
 * carries the reader to full screen by itself. The video starts, with sound,
 * when it reaches full screen, and pauses when it shrinks away. Browsers only
 * allow sound after a click or key press on the page, so without one it plays
 * muted and shows a "Turn sound on" button.
 */
const GROW_END = 0.33; // track progress where the card reaches full screen
const HOLD_END = 0.67; // track progress where it starts shrinking again
const SNAP_TO = 0.5; // track progress the snap lands on (middle of the hold)

type Props = { label: string; playLabel: string; muteLabel: string; unmuteLabel: string };

export default function StatementVideo({ label, playLabel, muteLabel, unmuteLabel }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);

  const userPaused = useRef(false);
  const started = useRef(false);

  // At full screen: from the start the first time, with sound when the
  // browser allows it, otherwise muted with a button to turn sound on.
  const startWithSound = (video: HTMLVideoElement) => {
    if (!started.current) {
      started.current = true;
      video.currentTime = 0;
    }
    video.muted = false;
    video
      .play()
      .then(() => {
        setMuted(false);
        setNeedsSound(false);
        setBlocked(false);
      })
      .catch(() => {
        video.muted = true;
        setMuted(true);
        video
          .play()
          .then(() => {
            setNeedsSound(true);
            setBlocked(false);
          })
          .catch(() => setBlocked(true));
      });
  };

  // Grow, hold, shrink, and the snap to full screen.
  useEffect(() => {
    const track = trackRef.current;
    const frame = frameRef.current;
    if (!track || !frame) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.style.setProperty("--p", "0");
      return;
    }
    let lastY = window.scrollY;
    let armed = true;
    let animating = false;

    const progress = () => {
      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      return { span, top: rect.top + window.scrollY, t: span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0 };
    };
    const update = () => {
      const { t } = progress();
      const raw = t < GROW_END ? t / GROW_END : t < HOLD_END ? 1 : (1 - t) / (1 - HOLD_END);
      const p = raw * raw * (3 - 2 * raw);
      frame.style.setProperty("--p", p.toFixed(4));
      // Only cover the site header while the video fills the screen.
      frame.parentElement?.toggleAttribute("data-full", p >= 0.98);
      const video = videoRef.current;
      if (!video) return;
      if (p >= 0.98 && video.paused && !userPaused.current) startWithSound(video);
      else if (p < 0.5 && !video.paused) video.pause();
    };
    /** Share of the card's height that is on screen. */
    const visibleShare = () => {
      const rect = frame.getBoundingClientRect();
      const shown = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
      return rect.height > 0 ? Math.max(0, shown) / rect.height : 0;
    };
    // While the page carries the reader to full screen, their own wheel,
    // touch and key scrolling is held back so it can't cancel the move.
    const block = (event: Event) => { if (animating) event.preventDefault(); };
    const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"]);
    const blockKeys = (event: KeyboardEvent) => { if (animating && scrollKeys.has(event.key)) event.preventDefault(); };
    const glideTo = (target: number) => {
      const from = window.scrollY;
      const distance = target - from;
      const duration = Math.min(1100, Math.max(650, Math.abs(distance) * 0.6));
      const start = performance.now();
      animating = true;
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / duration);
        const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        window.scrollTo(0, from + distance * eased);
        update();
        if (k < 1) requestAnimationFrame(step);
        else animating = false;
      };
      requestAnimationFrame(step);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      update();
      if (animating) return;
      const { span, top, t } = progress();
      const share = visibleShare();
      // Re-arm once the card is mostly below the fold again.
      if (t === 0 && share < 0.5) armed = true;
      if (armed && goingDown && share >= 0.5 && t < GROW_END) {
        armed = false;
        glideTo(top + span * SNAP_TO);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      started.current = true;
      video.muted = false;
      setMuted(false);
      setNeedsSound(false);
      video.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
      return;
    }
    video.muted = !video.muted;
    setMuted(video.muted);
    setNeedsSound(false);
  };

  return (
    <div className="svid-track" ref={trackRef}>
      <div className="svid-stage">
        <div className="svid-frame" ref={frameRef}>
          <video
            ref={videoRef}
            src="/assets/landing/toone-video.mp4"
            poster="/assets/landing/toone-video-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
            onClick={toggleSound}
          />
          {needsSound && !blocked ? (
            <button type="button" className="svid-unmute" onClick={toggleSound}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
              {unmuteLabel}
            </button>
          ) : null}
          {blocked ? (
            <button type="button" className="svid-play" onClick={toggleSound} aria-label={playLabel}>
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </button>
          ) : (
            <button type="button" className="svid-sound" onClick={toggleSound} aria-label={muted ? unmuteLabel : muteLabel}>
              {muted ? (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
