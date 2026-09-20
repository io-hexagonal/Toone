"use client";

import { useEffect, useRef } from "react";

/** The look, as CSS custom properties on .hg-root. Change these to retune. */
const DEFAULTS = {
  opacity: 0.7,
  blur: 43,
  contrast: 2.45,
  brightness: 1.25,
  saturate: 1.85,
  scale: 1.13,
};

/**
 * HeroGlitter — a treated video loop behind the hero. The source is a liquid
 * glitter clip, pre-blurred and desaturated at encode time; here it is blurred
 * again, pushed through a high-contrast curve so only its brightest glints
 * survive, and screened onto the page ground. The result reads as slow light
 * moving behind the content, not as a video.
 *
 * The look lives in DEFAULTS, applied as CSS variables on .hg-root.
 */
export default function HeroGlitter() {
  const videoRef = useRef<HTMLVideoElement>(null);

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
          `,
        }}
      />
      <div className="hg-root" aria-hidden="true">
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
    </>
  );
}
