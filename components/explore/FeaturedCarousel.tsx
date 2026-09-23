"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./FeaturedCarousel.module.css";

export type FeaturedSlide = {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  cta: string;
  coverUrl: string;
  coverAlt?: string;
};

type Copy = {
  featuredLabel: string;
  previousSlide: string;
  nextSlide: string;
  goToSlide: string;
  pause: string;
  play: string;
};

const AUTOPLAY_MS = 7_000;

/**
 * Featured routines and bundles, presented like the announcement carousel:
 * one full-bleed card, a slide at a time. Changing slides never moves focus
 * or scrolls the page. It advances on its own unless paused, hovered,
 * focused, hidden, or reduced motion is on; swipe, arrows, pills and the
 * arrow keys change slides.
 */
export default function FeaturedCarousel({ slides, copy }: { slides: FeaturedSlide[]; copy: Copy }) {
  const count = slides.length;
  const multiple = count > 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const drag = useRef<{ pointerId: number; x: number; y: number; axis: "horizontal" | "vertical" | null } | null>(null);
  const suppressClick = useRef(false);
  const rotating = multiple && playing && !hovered && !focused && visible && !reducedMotion;
  const slide = slides[index];

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
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, index, count]);

  // Warm the next covers so a change never shows an empty card.
  useEffect(() => {
    for (const item of slides) {
      const image = new Image();
      image.src = item.coverUrl;
    }
  }, [slides]);

  function select(next: number) {
    setPlaying(false);
    setIndex((next + count) % count);
  }

  function onKey(event: KeyboardEvent<HTMLElement>) {
    if (!multiple || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!multiple || !event.isPrimary || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === "mouse") event.preventDefault();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      start.axis = Math.abs(dx) > Math.abs(dy) * 1.3 ? "horizontal" : "vertical";
    }
    if (start.axis !== "horizontal") return;
    event.preventDefault();
    setDragOffset(Math.max(-80, Math.min(80, dx * 0.4)));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - start.x;
    suppressClick.current = !cancelled && start.axis === "horizontal";
    if (!cancelled && start.axis === "horizontal" && Math.abs(dx) > 60) select(index + (dx < 0 ? 1 : -1));
  }

  if (!slide) return null;
  const cardClass = [styles.card, multiple && styles.multiple, dragOffset !== 0 && styles.dragging].filter(Boolean).join(" ");
  return (
    <section className={`${styles.section} explore-width`} aria-label={copy.featuredLabel}>
      <div
        className={cardClass}
        role={multiple ? "region" : undefined}
        aria-roledescription={multiple ? "carousel" : undefined}
        aria-label={multiple ? copy.featuredLabel : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
        onKeyDown={onKey}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={slide.coverUrl} className={styles.image} src={slide.coverUrl} alt={slide.coverAlt ?? ""} draggable={false} />
        <div className={styles.shade} aria-hidden="true" />
        <div
          className={styles.stage}
          id="explore-featured-current"
          aria-live={rotating ? "off" : "polite"}
          aria-atomic="true"
          style={{ transform: `translateX(${dragOffset}px)` }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={(event) => endDrag(event)}
          onPointerCancel={(event) => endDrag(event, true)}
          onLostPointerCapture={(event) => endDrag(event, true)}
          onClickCapture={(event) => {
            if (suppressClick.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClick.current = false;
            }
          }}
        >
          <div
            key={slide.id}
            className={styles.body}
            role={multiple ? "group" : undefined}
            aria-roledescription={multiple ? "slide" : undefined}
            aria-label={multiple ? `${index + 1} / ${count}` : undefined}
          >
            <p className={styles.eyebrow}>{slide.eyebrow}</p>
            <h2 className={styles.title}>{slide.title}</h2>
            <p className={styles.summary}>{slide.summary}</p>
            <a className={styles.cta} href={slide.href}>
              {slide.cta}
            </a>
          </div>
        </div>
        {multiple && !reducedMotion && (
          <button type="button" className={styles.iconButton} onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? copy.pause : copy.play}>
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          </button>
        )}
        {multiple && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.previous}`} onClick={() => select(index - 1)}
              aria-label={copy.previousSlide} aria-controls="explore-featured-current">‹</button>
            <div className={styles.indicators} style={{ "--active-index": index } as CSSProperties}>
              {slides.map((item, position) => (
                <button key={item.id} type="button" className={styles.indicator}
                  aria-label={`${copy.goToSlide} ${position + 1}: ${item.title}`}
                  aria-current={position === index ? "true" : undefined}
                  aria-controls="explore-featured-current"
                  onClick={() => select(position)}>
                  <span />
                </button>
              ))}
            </div>
            <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => select(index + 1)}
              aria-label={copy.nextSlide} aria-controls="explore-featured-current">›</button>
          </>
        )}
      </div>
    </section>
  );
}
