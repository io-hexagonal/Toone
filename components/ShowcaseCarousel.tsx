"use client";

import { useState, useEffect, useCallback } from "react";

type Slide = {
  img: string;
  title: string;
  desc: string;
};

export default function ShowcaseCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const total = slides.length;

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current) return;
      setLeaving(current);
      setCurrent(idx);
      setTimeout(() => setLeaving(null), 800);
    },
    [current]
  );

  const go = useCallback(
    (dir: number) => {
      goTo((current + dir + total) % total);
    },
    [current, total, goTo]
  );

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [go]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <>
      {/* Carousel */}
      <div className="carousel">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`slide${i === current ? " active" : ""}${i === leaving ? " leaving" : ""}`}
          >
            <div
              className="slide-bg"
              style={{ backgroundImage: `url('${s.img}')` }}
            />
            <img
              className="slide-img"
              src={s.img}
              alt={s.title}
              loading={i < 2 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        className="nav-arrow nav-prev"
        aria-label="Previous"
        onClick={() => go(-1)}
      >
        <svg viewBox="0 0 16 16">
          <path d="M9.78 3.47a.75.75 0 010 1.06L6.81 7.5h5.44a.75.75 0 010 1.5H6.81l2.97 2.97a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" />
        </svg>
      </button>
      <button
        className="nav-arrow nav-next"
        aria-label="Next"
        onClick={() => go(1)}
      >
        <svg viewBox="0 0 16 16">
          <path d="M6.22 3.47a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.19 9H3.75a.75.75 0 010-1.5h5.44L6.22 4.53a.75.75 0 010-1.06z" />
        </svg>
      </button>

      {/* Dots */}
      <div className="dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`dot-indicator${i === current ? " active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="counter">
        {current + 1} / {total}
      </div>
    </>
  );
}
