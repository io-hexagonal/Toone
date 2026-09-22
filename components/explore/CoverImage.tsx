"use client";
import { useEffect, useRef } from "react";

/** Cover image that yields to the branded placeholder beneath it when the
    file fails to load or is too small to be a real picture (under 32px), so a
    broken or junk upload never shows as a grey slab. Load events usually fire
    before hydration, so the mounted state is checked as well. */
const MIN_COVER_PX = 32;
function usable(img: HTMLImageElement) {
  return img.naturalWidth >= MIN_COVER_PX && img.naturalHeight >= MIN_COVER_PX;
}
export default function CoverImage({
  className,
  src,
  alt = "",
}: {
  className: string;
  src: string;
  /** Empty (decorative) unless the record describes its cover. */
  alt?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && !usable(img)) {
      img.classList.add("is-broken");
    }
  }, [src]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={(event) => event.currentTarget.classList.add("is-broken")}
      onLoad={(event) => {
        if (!usable(event.currentTarget))
          event.currentTarget.classList.add("is-broken");
      }}
    />
  );
}
