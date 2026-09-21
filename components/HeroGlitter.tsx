"use client";

import { useEffect, useRef } from "react";

/**
 * The look is baked into the video at encode time (see scripts/hero/encode-loop.sh):
 * blur, saturation, contrast, brightness, the 0.7 opacity and the screen blend
 * against the #141413 ground. The browser plays a plain video layer, which keeps
 * the GPU idle. Retune by re-encoding; only the scale is still applied here.
 */
const SCALE = 1.13;

/**
 * HeroGlitter — a treated video loop behind the hero. The source is a liquid
 * glitter clip; the blur, high-contrast curve and screen onto the page ground
 * are all baked into the file, so what plays here is a plain, cheap video
 * layer. The result reads as slow light moving behind the content, not as a
 * video.
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
              --hg-scale: ${SCALE};
              position: absolute; inset: 0; z-index: 0; overflow: hidden;
              pointer-events: none; background: #141413;
              contain: strict;
            }
            .hg-video {
              position: absolute; inset: 0; width: 100%; height: 100%;
              object-fit: cover; object-position: center;
              transform: scale(var(--hg-scale));
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
            /* A whisper of film grain stops the blur from looking like a smear.
               Plain alpha, not a blend mode: a blend would re-composite the whole
               viewport against the moving video every frame. */
            .hg-grain {
              position: absolute; inset: 0; opacity: 0.035;
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
