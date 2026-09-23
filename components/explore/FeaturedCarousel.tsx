"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

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

type Copy = { featuredLabel: string; previousSlide: string; nextSlide: string; goToSlide: string };

const AUTOPLAY_MS = 6500;

/**
 * Featured routines and bundles: full-width, swipeable (native scroll snap),
 * with arrows, dots and arrow keys. It advances on its own, but stops while
 * hovered or focused, when the page is hidden, and for reduced motion.
 */
export default function FeaturedCarousel({ slides, copy }: { slides: FeaturedSlide[]; copy: Copy }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (index: number) => {
      const el = track.current;
      if (!el || !count) return;
      const target = el.children[((index % count) + count) % count] as HTMLElement | undefined;
      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    [count],
  );

  // The slide nearest the track's center is the active one.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let distance = Infinity;
      Array.from(el.children).forEach((child, index) => {
        const slide = child as HTMLElement;
        const d = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (d < distance) { distance = d; best = index; }
      });
      setActive(best);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") go(active + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [active, count, paused, go]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(active - 1); }
  };

  if (!count) return null;
  return (
    <section
      className="explore-featured"
      aria-roledescription="carousel"
      aria-label={copy.featuredLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="explore-featured-track" ref={track}>
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className="explore-featured-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${count}`}
            aria-hidden={index === active ? undefined : "true"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="explore-featured-cover" src={slide.coverUrl} alt={slide.coverAlt ?? ""} loading={index === 0 ? "eager" : "lazy"} />
            <div className="explore-featured-copy">
              <p className="explore-eyebrow">{slide.eyebrow}</p>
              <h2>{slide.title}</h2>
              <p className="explore-featured-summary">{slide.summary}</p>
              <a className="explore-featured-cta" href={slide.href} tabIndex={index === active ? 0 : -1}>
                {slide.cta} <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
      {count > 1 && (
        <div className="explore-featured-controls explore-width">
          <div className="explore-featured-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${copy.goToSlide} ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => go(index)}
              />
            ))}
          </div>
          <div className="explore-featured-arrows">
            <button type="button" aria-label={copy.previousSlide} onClick={() => go(active - 1)}>←</button>
            <button type="button" aria-label={copy.nextSlide} onClick={() => go(active + 1)}>→</button>
          </div>
        </div>
      )}
    </section>
  );
}
