import type { CSSProperties, ReactNode } from "react";

/*
 * Lookalikes of the SF Symbols the desktop app uses, drawn from scratch on a
 * 16-unit grid with simple strokes. They are NOT traced from SF Symbols (the
 * SF Symbols licence limits where those outlines may appear). Keep it that
 * way: add a glyph by drawing its idea in a few lines/arcs, not its outline.
 *
 * "Filled" symbols (`*.fill`) knock their inner mark out with
 * `--tu-glyph-knockout` (defaults to the card fill); set it on a parent when a
 * filled glyph sits on another surface.
 */

const K = "var(--tu-glyph-knockout, var(--tu-inner, #1a1a1a))";

const GLYPHS = {
  // ---- navigation and actions ------------------------------------------
  plus: <path d="M8 3v10M3 8h10" />,
  xmark: <path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" />,
  "chevron.right": <path d="M6 3.2L10.8 8 6 12.8" />,
  "chevron.down": <path d="M3.2 6L8 10.8 12.8 6" />,
  "chevron.up": <path d="M3.2 10L8 5.2 12.8 10" />,
  "chevron.left": <path d="M10 3.2L5.2 8 10 12.8" />,
  "arrow.up.forward.square": (
    <>
      <path d="M7.4 2.6H4a1.6 1.6 0 0 0-1.6 1.6V12A1.6 1.6 0 0 0 4 13.6h7.8a1.6 1.6 0 0 0 1.6-1.6V8.6" />
      <path d="M7.6 8.4l5.8-5.8M9.4 2.6h4v4" />
    </>
  ),
  "globe.badge.chevron.backward": (
    <>
      <path d="M13.4 6.6A6 6 0 1 0 6.6 13.4" />
      <path d="M7.6 2.1C6.4 3.4 5.6 5.5 5.6 7.9s.8 4.5 2 5.8M8.4 2.1c.9 1 1.6 2.4 1.9 4" />
      <path d="M2 7.9h6.2M2.8 5h10.4" />
      <path d="M13.6 9.6l-2.8 2.4 2.8 2.4" strokeWidth="1.9" />
    </>
  ),
  photo: (
    <>
      <rect x="1.8" y="3" width="12.4" height="10" rx="1.8" />
      <circle cx="5.4" cy="6.2" r="1.1" />
      <path d="M2.2 12l3.6-3.4 2.4 2.2 2.6-3 3.2 3.6" />
    </>
  ),
  "checkmark.seal.fill": (
    <>
      <path
        d="M8 1.2l1.6 1.3 2-.2.6 2 1.8 1-.6 1.9.6 1.9-1.8 1-.6 2-2-.2L8 14.8l-1.6-1.3-2 .2-.6-2-1.8-1 .6-1.9-.6-1.9 1.8-1 .6-2 2 .2z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M5.4 8.1l1.8 1.8 3.4-3.6" stroke={K} strokeWidth="1.6" />
    </>
  ),
  magnifyingglass: (
    <>
      <circle cx="6.8" cy="6.8" r="4.6" />
      <path d="M10.3 10.3L14 14" />
    </>
  ),
  pencil: (
    <>
      <path d="M11.2 2.4l2.4 2.4-8 8-3.2.8.8-3.2z" />
      <path d="M9.6 4l2.4 2.4" />
    </>
  ),
  "info.circle": (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 7.2v4" />
      <circle cx="8" cy="4.9" r=".55" fill="currentColor" />
    </>
  ),
  "person.badge.plus": (
    <>
      <circle cx="6" cy="5.2" r="2.6" />
      <path d="M1.6 13.6c0-2.7 2-4.4 4.4-4.4s4.4 1.7 4.4 4.4" />
      <path d="M12.6 2.4v5M10.1 4.9h5" />
    </>
  ),
  "person.2": (
    <>
      <circle cx="5.6" cy="5.4" r="2.4" />
      <path d="M1.4 13.4c0-2.5 1.8-4.1 4.2-4.1s4.2 1.6 4.2 4.1" />
      <circle cx="11.2" cy="4.6" r="2" />
      <path d="M11 8.6c2.2 0 3.6 1.4 3.6 3.6" />
    </>
  ),
  "person.2.badge.gearshape": (
    <>
      <circle cx="5.2" cy="5.4" r="2.3" />
      <path d="M1.2 13.2c0-2.4 1.7-3.9 4-3.9s4 1.5 4 3.9" />
      <circle cx="10.4" cy="4.4" r="1.9" />
      <circle cx="12.4" cy="11.8" r="1.5" />
      <path d="M12.4 9.2v.8M12.4 13.6v.8M9.8 11.8h.8M14.2 11.8h.8" />
    </>
  ),
  "bubble.left.and.bubble.right": (
    <>
      <path d="M6.6 3.2h6a1.6 1.6 0 0 1 1.6 1.6v3a1.6 1.6 0 0 1-1.6 1.6h-.4v1.8l-2-1.8" />
      <path d="M3.4 6.4h5.4A1.6 1.6 0 0 1 10.4 8v3a1.6 1.6 0 0 1-1.6 1.6H5.6l-2.4 2v-2A1.6 1.6 0 0 1 1.8 11V8a1.6 1.6 0 0 1 1.6-1.6z" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <ellipse cx="8" cy="8" rx="2.7" ry="6.4" />
      <path d="M1.6 8h12.8M2.6 4.8h10.8M2.6 11.2h10.8" />
    </>
  ),
  safari: (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M10.8 5.2L9 9 5.2 10.8 7 7z" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="1.8" y="2.8" width="12.4" height="11.2" rx="2" />
      <path d="M1.8 6.2h12.4M5 1.4v2.6M11 1.4v2.6" />
      <path d="M5 9h.01M8 9h.01M11 9h.01M5 11.6h.01M8 11.6h.01" strokeWidth="1.8" />
    </>
  ),
  "arrow.triangle.branch": (
    <>
      <path d="M5 14V2.6M2.8 4.6L5 2.4l2.2 2.2" />
      <path d="M5 10.4c0-3.6 6-2.8 6-6.8V2.6M8.8 4.6L11 2.4l2.2 2.2" />
    </>
  ),
  gearshape: (
    <>
      <circle cx="8" cy="8" r="2.1" />
      <circle cx="8" cy="8" r="4.6" />
      <path
        d="M8 1.4v1.8M8 12.8v1.8M1.4 8h1.8M12.8 8h1.8M3.3 3.3l1.3 1.3M11.4 11.4l1.3 1.3M3.3 12.7l1.3-1.3M11.4 4.6l1.3-1.3"
        strokeWidth="2"
      />
    </>
  ),
  "sidebar.left": (
    <>
      <rect x="1.6" y="3" width="12.8" height="10" rx="2" />
      <path d="M6 3v10M3.4 5.6h1M3.4 7.6h1" />
    </>
  ),
  "sidebar.right": (
    <>
      <rect x="1.6" y="3" width="12.8" height="10" rx="2" />
      <path d="M10 3v10M11.6 5.6h1M11.6 7.6h1" />
    </>
  ),
  folder: (
    <path d="M1.6 4.6a1.2 1.2 0 0 1 1.2-1.2h3.4l1.6 1.6h5.4a1.2 1.2 0 0 1 1.2 1.2v6.2a1.2 1.2 0 0 1-1.2 1.2H2.8a1.2 1.2 0 0 1-1.2-1.2z" />
  ),
  "folder.fill": (
    <path
      d="M1.6 4.6a1.2 1.2 0 0 1 1.2-1.2h3.4l1.6 1.6h5.4a1.2 1.2 0 0 1 1.2 1.2v6.2a1.2 1.2 0 0 1-1.2 1.2H2.8a1.2 1.2 0 0 1-1.2-1.2z"
      fill="currentColor"
    />
  ),
  "folder.badge.plus": (
    <>
      <path d="M9.4 12.6H2.8a1.2 1.2 0 0 1-1.2-1.2V4.6a1.2 1.2 0 0 1 1.2-1.2h3.4l1.6 1.6h5.4a1.2 1.2 0 0 1 1.2 1.2v1.6" />
      <path d="M12.6 9v5M10.1 11.5h5" />
    </>
  ),
  "doc.text": (
    <>
      <path d="M4.2 1.6h4.9l3.3 3.3v8.3a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 13.2V2.8a1.2 1.2 0 0 1 1.2-1.2z" />
      <path d="M9 1.8v3.2h3.2M5.4 8h5.2M5.4 10.4h5.2" />
    </>
  ),
  "doc.on.doc": (
    <>
      <rect x="5.2" y="4.6" width="8.4" height="10" rx="1.4" />
      <path d="M3.6 11.4h-.2a1 1 0 0 1-1-1V2.6a1 1 0 0 1 1-1h6.2a1 1 0 0 1 1 1v.4" />
    </>
  ),
  "list.bullet.rectangle": (
    <>
      <rect x="1.6" y="2.8" width="12.8" height="10.4" rx="2" />
      <path d="M4.6 6.2h.01M4.6 9.8h.01" strokeWidth="1.9" />
      <path d="M7 6.2h4.6M7 9.8h4.6" />
    </>
  ),
  "slider.horizontal.3": (
    <>
      <path d="M2 4h12M2 8h12M2 12h12" />
      <circle cx="10" cy="4" r="1.4" fill={K} />
      <circle cx="5" cy="8" r="1.4" fill={K} />
      <circle cx="11" cy="12" r="1.4" fill={K} />
    </>
  ),
  "arrow.up": <path d="M8 13.6V2.6M3.6 7L8 2.6 12.4 7" />,
  "arrow.right.circle": (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M4.8 8h6M8.4 5.4L11 8l-2.6 2.6" />
    </>
  ),
  "arrow.up.left.and.arrow.down.right": (
    <path d="M2.8 7V2.8H7M2.8 2.8l4 4M13.2 9v4.2H9M13.2 13.2l-4-4" />
  ),
  scope: (
    <>
      <circle cx="8" cy="8" r="5" />
      <path d="M8 1.2v3M8 11.8v3M1.2 8h3M11.8 8h3" />
      <circle cx="8" cy="8" r=".6" fill="currentColor" />
    </>
  ),

  // ---- status and state --------------------------------------------------
  "circle.fill": <circle cx="8" cy="8" r="6.2" fill="currentColor" stroke="none" />,
  "circle.dashed": <circle cx="8" cy="8" r="6" strokeDasharray="2.1 2.1" />,
  "play.circle.fill": (
    <>
      <circle cx="8" cy="8" r="6.8" fill="currentColor" stroke="none" />
      <path d="M6.5 5.2v5.6L10.9 8z" fill={K} stroke={K} strokeWidth="0.8" />
    </>
  ),
  "pause.circle.fill": (
    <>
      <circle cx="8" cy="8" r="6.8" fill="currentColor" stroke="none" />
      <path d="M6.3 5.4v5.2M9.7 5.4v5.2" stroke={K} strokeWidth="1.7" />
    </>
  ),
  "stop.circle": (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <rect x="5.7" y="5.7" width="4.6" height="4.6" rx="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  "stop.fill": <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" stroke="none" />,
  "checkmark.circle.fill": (
    <>
      <circle cx="8" cy="8" r="6.8" fill="currentColor" stroke="none" />
      <path d="M5 8.2l2 2 4-4.4" stroke={K} strokeWidth="1.7" />
    </>
  ),
  "questionmark.circle.fill": (
    <>
      <circle cx="8" cy="8" r="6.8" fill="currentColor" stroke="none" />
      <path d="M6.1 6.3a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.8.7-.8 1.3v.3" stroke={K} strokeWidth="1.5" />
      <circle cx="8" cy="11.6" r=".9" fill={K} stroke="none" />
    </>
  ),
  "exclamationmark.triangle.fill": (
    <>
      <path
        d="M7 2.4a1.15 1.15 0 0 1 2 0l5.6 9.8a1.15 1.15 0 0 1-1 1.7H2.4a1.15 1.15 0 0 1-1-1.7z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M8 5.6v3.6" stroke={K} strokeWidth="1.6" />
      <circle cx="8" cy="11.4" r=".9" fill={K} stroke="none" />
    </>
  ),
  "wand.and.stars": (
    <>
      <path d="M2.4 13.6l7.2-7.2" strokeWidth="1.7" />
      <path d="M11.6 1.8v2.8M10.2 3.2H13M13.6 6.6v2.2M12.5 7.7h2.2M6.6 1.6v2M5.6 2.6h2" />
    </>
  ),
  "waveform.path.ecg": <path d="M1.2 8.4h2.6l1.6-4.2 2.4 8 2-6.2 1.3 2.4h3.7" />,
  "chevron.up.circle.fill": (
    <>
      <circle cx="8" cy="8" r="6.8" fill="currentColor" stroke="none" />
      <path d="M5 9.4L8 6.4l3 3" stroke={K} strokeWidth="1.6" />
    </>
  ),
  "chevron.down.circle": (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M5.2 6.8L8 9.6l2.8-2.8" />
    </>
  ),

  // ---- graph and objects --------------------------------------------------
  "tray.and.arrow.down": (
    <>
      <path d="M1.8 9.4v3.2a1.2 1.2 0 0 0 1.2 1.2h10a1.2 1.2 0 0 0 1.2-1.2V9.4h-3.4l-1 1.6H6.2l-1-1.6z" />
      <path d="M8 1.6v6M5.4 5.2L8 7.8l2.6-2.6" />
    </>
  ),
  "arrow.turn.down.right": <path d="M3.6 2.4v5.2a2.2 2.2 0 0 0 2.2 2.2h7.6M10.6 7l2.8 2.8-2.8 2.8" />,
  shippingbox: (
    <>
      <path d="M8 1.6l5.8 2.9v7L8 14.4l-5.8-2.9v-7z" />
      <path d="M2.2 4.5L8 7.4l5.8-2.9M8 7.4v7M5.1 3l5.8 2.9" />
    </>
  ),
  "building.2": (
    <>
      <path d="M1.8 14.2V6.4h5v7.8M6.8 14.2V2.2h7.4v12M1 14.2h14" />
      <path d="M9.2 4.8h2.6M9.2 7.4h2.6M9.2 10h2.6M3.6 9h1.4M3.6 11.4h1.4" />
    </>
  ),
  "point.3.connected.trianglepath.dotted": (
    <>
      <path d="M8 3.6L3.6 11.6M8 3.6l4.4 8M4.4 12.6h7.2" strokeDasharray="1.2 1.6" />
      <circle cx="8" cy="3" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12.4" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12.4" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  "quote.bubble": (
    <>
      <path d="M3.2 2.6h9.6a1.6 1.6 0 0 1 1.6 1.6v5.6a1.6 1.6 0 0 1-1.6 1.6H7.2l-3 2.6v-2.6h-1a1.6 1.6 0 0 1-1.6-1.6V4.2a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M5.8 5.6v1.8M9.4 5.6v1.8" strokeWidth="1.8" />
    </>
  ),
  "mic.fill": (
    <>
      <rect x="5.6" y="1.4" width="4.8" height="8.2" rx="2.4" fill="currentColor" stroke="none" />
      <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2.4" />
    </>
  ),
  "speaker.wave.2": (
    <>
      <path d="M1.8 6h2.4l3.4-2.8v9.6L4.2 10H1.8z" />
      <path d="M10 5.6a3.4 3.4 0 0 1 0 4.8M12 3.6a6.2 6.2 0 0 1 0 8.8" />
    </>
  ),
  "icloud.and.arrow.down": (
    <>
      <path d="M4.4 12.4H4a3 3 0 0 1-.4-6 4.4 4.4 0 0 1 8.5-.8 3.4 3.4 0 0 1 .3 6.8h-.8" />
      <path d="M8 7v7M5.8 11.8L8 14l2.2-2.2" />
    </>
  ),
  trash: (
    <>
      <path d="M2.4 4h11.2M6 4V2.4h4V4M3.8 4l.8 9.6a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.8-9.6" />
      <path d="M6.6 6.6v5.2M9.4 6.6v5.2" />
    </>
  ),
  "puzzlepiece.extension": (
    <path d="M2.4 5.2h3.2a1.8 1.8 0 1 1 3.4 0h3.2v3.2a1.8 1.8 0 1 1 0 3.4v2.4H2.4v-3a1.8 1.8 0 1 0 0-3z" />
  ),
  cpu: (
    <>
      <rect x="3.6" y="3.6" width="8.8" height="8.8" rx="1.4" />
      <rect x="6.2" y="6.2" width="3.6" height="3.6" rx=".6" />
      <path d="M6 1.4v2.2M10 1.4v2.2M6 12.4v2.2M10 12.4v2.2M1.4 6h2.2M1.4 10h2.2M12.4 6h2.2M12.4 10h2.2" />
    </>
  ),
  "bolt.fill": <path d="M9.4 1.2L3.4 9.2h4l-1 5.6 6.2-8.2H8.6z" fill="currentColor" strokeWidth="0.8" />,
  // ---- routines sidebar (history, run controls, step states) -------------
  circle: <circle cx="8" cy="8" r="6.2" />,
  "circle.dotted": <circle cx="8" cy="8" r="6" strokeDasharray="0.01 2.36" strokeWidth="1.9" />,
  "play.fill": <path d="M4.6 2.8v10.4l8.4-5.2z" fill="currentColor" strokeWidth="1" />,
  "pause.fill": (
    <>
      <rect x="3.6" y="2.6" width="3" height="10.8" rx="1" fill="currentColor" stroke="none" />
      <rect x="9.4" y="2.6" width="3" height="10.8" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  "clock.arrow.circlepath": (
    <>
      <path d="M2.7 8.6A5.4 5.4 0 1 0 4.3 4.1" />
      <path d="M4.6 1.9v2.5H2.1" />
      <path d="M8.2 5.4v2.9l2 1.3" />
    </>
  ),
  "line.3.horizontal.decrease.circle": (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M4.9 6.1h6.2M5.9 8.1h4.2M6.9 10.1h2.2" />
    </>
  ),
  "checkmark.seal": (
    <>
      <path d="M8 1.2l2.18 1.53 2.63.46.46 2.63L14.8 8l-1.53 2.18-.46 2.63-2.63.46L8 14.8l-2.18-1.53-2.63-.46-.46-2.63L1.2 8l1.53-2.18.46-2.63 2.63-.46z" />
      <path d="M5.5 8.2l1.7 1.7 3.3-3.6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof GLYPHS;

export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];

const WEIGHTS = {
  regular: 1.3,
  medium: 1.45,
  semibold: 1.65,
  bold: 1.9,
} as const;

export type GlyphWeight = keyof typeof WEIGHTS;

type GlyphProps = {
  name: GlyphName;
  /** Rendered square size in px. An SF Symbol at font size N is about N × 1.15. */
  size?: number;
  weight?: GlyphWeight;
  /** Any CSS colour; defaults to the surrounding text colour. */
  color?: string;
  className?: string;
  style?: CSSProperties;
};

/** One SF-Symbol-like glyph. Decorative: always aria-hidden. */
export function Glyph({ name, size = 12, weight = "regular", color, className, style }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={WEIGHTS[weight]}
      style={{ display: "inline-block", flex: "none", color, ...style }}
      viewBox="0 0 16 16"
      width={size}
    >
      {GLYPHS[name]}
    </svg>
  );
}
