"use client";

import { useEffect, useRef, useState } from "react";

/** The look, as CSS custom properties on .hg-root. Change these to retune. */
const DEFAULTS = {
  opacity: 0.7,
  blur: 43,
  contrast: 2.45,
  brightness: 1.25,
  saturate: 1.85,
  scale: 1.13,
};
type Knob = keyof typeof DEFAULTS;
const RANGES: Record<Knob, [number, number, number]> = {
  opacity: [0, 1, 0.01], blur: [0, 60, 1], contrast: [0.5, 3, 0.05],
  brightness: [0.1, 1.5, 0.05], saturate: [0, 2, 0.05], scale: [1, 1.6, 0.01],
};
const UNITS: Partial<Record<Knob, string>> = { blur: "px" };

/**
 * HeroGlitter — a treated video loop behind the hero. The source is a liquid
 * glitter clip, pre-blurred and desaturated at encode time; here it is blurred
 * again, pushed through a high-contrast curve so only its brightest glints
 * survive, and screened onto the page ground. The result reads as slow light
 * moving behind the content, not as a video.
 *
 * Tuning lives in the CSS variables on .hg-root so it can be adjusted live.
 */
export default function HeroGlitter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tune, setTune] = useState<typeof DEFAULTS | null>(null);

  // Development aid: ?hg-tune on the URL shows live sliders for the look.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (new URLSearchParams(window.location.search).has("hg-tune")) setTune({ ...DEFAULTS });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (motion.matches) video.pause();
      else void video.play().catch(() => { /* autoplay blocked: poster stays */ });
    };
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hg-root {
              --hg-opacity: ${DEFAULTS.opacity};
              --hg-blur: ${DEFAULTS.blur}px;
              --hg-contrast: ${DEFAULTS.contrast};
              --hg-brightness: ${DEFAULTS.brightness};
              --hg-saturate: ${DEFAULTS.saturate};
              --hg-scale: ${DEFAULTS.scale};
              position: absolute; inset: 0; z-index: 0; overflow: hidden;
              pointer-events: none; background: #141413;
              contain: strict;
            }
            .hg-video {
              position: absolute; inset: 0; width: 100%; height: 100%;
              object-fit: cover; object-position: center;
              transform: scale(var(--hg-scale));
              filter: blur(var(--hg-blur)) saturate(var(--hg-saturate)) contrast(var(--hg-contrast)) brightness(var(--hg-brightness));
              opacity: var(--hg-opacity);
              mix-blend-mode: screen;
              will-change: transform;
              animation: hg-drift 40s ease-in-out infinite alternate;
            }
            @keyframes hg-drift {
              from { transform: scale(var(--hg-scale)) translate3d(-1.5%, -1%, 0); }
              to { transform: scale(var(--hg-scale)) translate3d(1.5%, 1%, 0); }
            }
            /* Keep the light in the middle distance: vignette to the page ground
               at the edges, and a floor fade so the section melts into the next. */
            .hg-vignette {
              position: absolute; inset: 0;
              background:
                radial-gradient(ellipse 80% 70% at 50% 45%, rgba(20,20,19,0) 0%, rgba(20,20,19,0.55) 60%, #141413 100%),
                linear-gradient(180deg, rgba(20,20,19,0.75) 0%, rgba(20,20,19,0) 22%, rgba(20,20,19,0) 70%, #141413 100%);
            }
            /* A whisper of film grain stops the blur from looking like a smear. */
            .hg-grain {
              position: absolute; inset: 0; opacity: 0.06; mix-blend-mode: overlay;
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
              background-size: 160px 160px;
            }
            @media (prefers-reduced-motion: reduce) {
              .hg-video { animation: none; }
            }
            .hg-tune {
              position: fixed; right: 16px; bottom: 16px; z-index: 200; width: 240px;
              padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
              background: rgba(20,20,19,0.9); color: rgba(255,255,255,0.85); font: 12px/1.4 ui-monospace, Menlo, monospace;
              display: grid; gap: 8px;
            }
            .hg-tune label { display: grid; grid-template-columns: 1fr auto; gap: 4px; }
            .hg-tune input { grid-column: 1 / -1; width: 100%; accent-color: #f0ede6; }
            .hg-tune textarea { grid-column: 1 / -1; width: 100%; height: 88px; font: inherit; background: #0f0f0e; color: inherit; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px; resize: none; }
          `,
        }}
      />
      <div
        className="hg-root"
        aria-hidden="true"
        style={tune ? Object.fromEntries(Object.entries(tune).map(([k, v]) => [`--hg-${k}`, `${v}${UNITS[k as Knob] ?? ""}`])) as React.CSSProperties : undefined}
      >
        <video
          ref={videoRef}
          className="hg-video"
          src="/assets/hero/glitter-loop.mp4"
          poster="/assets/hero/glitter-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
        />
        <div className="hg-vignette" />
        <div className="hg-grain" />
      </div>
      {tune && (
        <div className="hg-tune">
          {(Object.keys(DEFAULTS) as Knob[]).map(key => (
            <label key={key}>
              <span>{key}</span><span>{tune[key]}{UNITS[key] ?? ""}</span>
              <input type="range" min={RANGES[key][0]} max={RANGES[key][1]} step={RANGES[key][2]} value={tune[key]}
                onChange={event => setTune({ ...tune, [key]: Number(event.target.value) })} />
            </label>
          ))}
          <textarea readOnly value={JSON.stringify(tune, null, 1)} aria-label="Current values" />
        </div>
      )}
    </>
  );
}
