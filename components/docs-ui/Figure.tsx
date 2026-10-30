"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./docs-ui.module.css";

/**
 * Figure frame (plan §0.2). Renders the dark crop at its natural width and,
 * when the column is narrower, scales the whole crop down with a transform
 * (measured with ResizeObserver) so the replica never re-flows.
 */
type Props = {
  width: number;
  radius: 16 | 24;
  label: string;
  caption: string;
  children: ReactNode;
};

const SHADOW_GUTTER = 32; // horizontal padding of .scaleBox (16 each side)

export default function Figure({ width, radius, label, caption, children }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const frame = frameRef.current;
    if (!outer || !frame) return;
    const measure = () => {
      const available = (outer.parentElement?.clientWidth ?? width) - SHADOW_GUTTER;
      setScale(Math.min(1, available / width));
      setHeight(frame.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (outer.parentElement) observer.observe(outer.parentElement);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [width]);

  return (
    <figure className={styles.figure}>
      <div
        className={styles.scaleBox}
        ref={outerRef}
        style={{
          width: width * scale,
          height: height === null ? undefined : height * scale,
        }}
      >
        <div
          aria-label={label}
          className={`${styles.root} ${styles.frame}`}
          ref={frameRef}
          role="img"
          style={{ width, borderRadius: radius, transform: scale === 1 ? undefined : `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
