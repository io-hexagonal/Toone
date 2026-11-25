"use client";

import { useEffect } from "react";

/**
 * Elements matching `selector` drift toward a nearby cursor, then spring
 * back. Ported from distribution.dev's "magnetic" buttons with the same
 * constants: strength 0.22, reach 90px plus half the element, easing 0.18.
 * Mouse and trackpad only; off for reduced motion and touch. Renders nothing.
 */
const STRENGTH = 0.22;
const REACH = 90;
const EASE = 0.18;

export default function MagneticPull({ selector }: { selector: string }) {
  useEffect(() => {
    if (
      !window.matchMedia ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    let mx = -1e4;
    let my = -1e4;
    let raf = 0;
    const state = els.map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));

    const tick = () => {
      raf = 0;
      let busy = false;
      for (const o of state) {
        const r = o.el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > innerHeight + 50) {
          o.tx = 0;
          o.ty = 0;
        } else {
          // Measure from the resting centre, not the displaced one.
          const cx = r.left + r.width / 2 - o.x;
          const cy = r.top + r.height / 2 - o.y;
          const dx = mx - cx;
          const dy = my - cy;
          const d = Math.hypot(dx, dy);
          const reach = REACH + Math.max(r.width, r.height) / 2 - REACH / 2;
          const f = d < reach ? 1 - d / reach : 0;
          o.tx = dx * STRENGTH * f;
          o.ty = dy * STRENGTH * f;
        }
        o.x += (o.tx - o.x) * EASE;
        o.y += (o.ty - o.y) * EASE;
        if (Math.abs(o.tx - o.x) > 0.05 || Math.abs(o.ty - o.y) > 0.05) busy = true;
        o.el.style.translate = `${o.x.toFixed(2)}px ${o.y.toFixed(2)}px`;
      }
      if (busy) raf = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      schedule();
    };
    const onLeave = () => {
      mx = -1e4;
      my = -1e4;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
      for (const o of state) o.el.style.translate = "";
    };
  }, [selector]);

  return null;
}
