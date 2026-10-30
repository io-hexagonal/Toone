import type { CSSProperties, ReactNode } from "react";

/*
 * Kit for schematic / composite figures (coverage audit batch F): draw a
 * whole screen at its real size in app points, then scale it into the
 * figure with a transform (CONTRACT: scale, never reflow).
 *
 * - <Miniature>: the scaling viewport. Children lay out at real size; the
 *   box shows `width × height` of them (from `origin`) at `scale`.
 * - SCREEN + panelFrames(): the floating panels' frames per layout, ported
 *   from FloatingPanel.swift `defaultFrame` (padding 8, gap 8; chat 28% /
 *   project 24% of the visible width; Compact = 85% height with a 44pt top
 *   offset; Docked = chat 55% × 40% centred at the bottom, project 24% × 50%
 *   anchored 8pt right of it; Zen = (W − 24) × 2/3 and × 1/3, full height;
 *   Spotlight = chat 53% × 1/3 centred, project parked off-screen).
 *   The "middle" frame is the one Routines / Browser / Timeline / Calendar
 *   use in Full Height and Compact (between chat and project, 8pt gaps);
 *   other layouts are not ported. Top-left origin (AppKit's is bottom-left;
 *   every case is symmetric or explicitly anchored, so the flip is per case).
 * - <Desktop>: the neutral grey desktop (no wallpaper art) or a backdrop.
 * - <ScreenPanel>: one floating panel on that desktop: r24
 *   (WindowSurfaceStyle.regularFloating, DesignTokens.swift:99-102), the
 *   frozen-glass fill, the 1pt white .15 border (LayoutStyle.swift:242-262)
 *   and Shadows.panel (Shadows.swift:66-69).
 * - <Callout>: a short label drawn in FIGURE coordinates, outside the
 *   scaled layer, so it stays ≥11px however small the screen gets.
 * - <Keycap>: LayoutHotkeysStepView.swift:73-86 (11pt rounded medium,
 *   padding 6/3, r4, inputBackground, 1pt borderMedium).
 *
 * Screen = 1440 × 900 (16:10, menu bar ignored), the same screen
 * scenes/panel-layouts.tsx uses for its tiles.
 */

export const SCREEN = { width: 1440, height: 900 } as const;

export type Rect = { x: number; y: number; w: number; h: number };
export type PanelLayoutId = "fullHeight" | "compact" | "docked" | "zen" | "spotlight";
export type PanelFrames = { chat: Rect; project: Rect | null; middle: Rect | null };

const PADDING = 8;
const GAP = 8;

/** FloatingPanel.swift:31-206 (`defaultFrame`) for chat, project and the middle panels. */
export function panelFrames(
  layout: PanelLayoutId,
  screen: { width: number; height: number } = SCREEN,
  projectVisible = true,
): PanelFrames {
  const W = screen.width;
  const H = screen.height;
  const chatW = W * 0.28;
  const projW = W * 0.24;
  const chatRight = PADDING + chatW;
  const projLeft = W - projW - PADDING;
  const middleRight = projectVisible ? projLeft : W - PADDING;
  const middleW = middleRight - chatRight - GAP * 2;
  const full = H - PADDING * 2;
  const compactH = H * 0.85;
  const project = (r: Rect) => (projectVisible ? r : null);

  switch (layout) {
    case "fullHeight":
      return {
        chat: { x: PADDING, y: PADDING, w: chatW, h: full },
        project: project({ x: projLeft, y: PADDING, w: projW, h: full }),
        middle: { x: chatRight + GAP, y: PADDING, w: middleW, h: full },
      };
    case "compact":
      return {
        chat: { x: PADDING, y: 44, w: chatW, h: compactH },
        project: project({ x: projLeft, y: 44, w: projW, h: compactH }),
        middle: { x: chatRight + GAP, y: 44, w: middleW, h: compactH },
      };
    case "docked": {
      const w = W * 0.55;
      const h = H * 0.4;
      const x = (W - w) / 2;
      const ph = H * 0.5;
      return {
        chat: { x, y: H - PADDING - h, w, h },
        project: project({ x: x + w + GAP, y: H - PADDING - ph, w: W * 0.24, h: ph }),
        middle: null,
      };
    }
    case "zen": {
      const inner = W - PADDING * 2 - GAP;
      return {
        chat: { x: PADDING, y: PADDING, w: inner * (2 / 3), h: full },
        project: project({ x: PADDING + inner * (2 / 3) + GAP, y: PADDING, w: inner / 3, h: full }),
        middle: null,
      };
    }
    case "spotlight": {
      const w = W * 0.53;
      const h = H / 3;
      return { chat: { x: (W - w) / 2, y: (H - h) / 2, w, h }, project: null, middle: null };
    }
  }
}

/** Scaling viewport: children lay out at real size, the box shows them at `scale`. */
export function Miniature({
  width,
  height,
  scale,
  origin = { x: 0, y: 0 },
  contentWidth,
  children,
  style,
}: {
  /** Visible width of the content, in content px (app points). */
  width: number;
  /** Visible height of the content, in content px. */
  height: number;
  scale: number;
  /** Content point shown at the box's top-left (crop). */
  origin?: { x: number; y: number };
  /** Width the content lays out at; defaults to origin.x + width. */
  contentWidth?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: width * scale,
        height: height * scale,
        overflow: "hidden",
        flex: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: contentWidth ?? origin.x + width,
          transform: `scale(${scale}) translate(${-origin.x}px, ${-origin.y}px)`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Neutral grey desktop (no wallpaper photo), or a custom backdrop (Zen's video). */
export function Desktop({
  width = SCREEN.width,
  height = SCREEN.height,
  backdrop,
  children,
}: {
  width?: number;
  height?: number;
  backdrop?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        background: "linear-gradient(180deg, #77777b 0%, #5f5f63 100%)",
      }}
    >
      {backdrop ? <div style={{ position: "absolute", inset: 0 }}>{backdrop}</div> : null}
      {children}
    </div>
  );
}

/** One floating panel on the desktop, at a frame from panelFrames(). */
export function ScreenPanel({ rect, children, style }: { rect: Rect; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: 24,
        overflow: "hidden",
        background: "var(--tu-panel)",
        boxShadow: "0 1px 1px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          boxShadow: "inset 0 0 0 1px var(--tu-panel-border)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
    </div>
  );
}

type Pointer = "up" | "down" | "left" | "right";

const CALLOUT_FILL = "var(--tu-control-tint)";

/**
 * A short label in figure coordinates. With a pointer, (x, y) is the tip of
 * the pointer and the pill sits on the opposite side; without one, (x, y) is
 * the pill's centre. 12px semibold on the prominent-button grey.
 */
export function Callout({
  x,
  y,
  pointer,
  children,
}: {
  x: number;
  y: number;
  pointer?: Pointer;
  children: ReactNode;
}) {
  const transform = {
    up: "translate(-50%, 0)",
    down: "translate(-50%, -100%)",
    left: "translate(0, -50%)",
    right: "translate(-100%, -50%)",
    none: "translate(-50%, -50%)",
  }[pointer ?? "none"];
  const vertical = pointer === "up" || pointer === "down";
  const tip = 5;
  const triangle: CSSProperties = {
    width: 0,
    height: 0,
    flex: "none",
    ...(pointer === "up" && { borderLeft: `${tip}px solid transparent`, borderRight: `${tip}px solid transparent`, borderBottom: `${tip}px solid ${CALLOUT_FILL}` }),
    ...(pointer === "down" && { borderLeft: `${tip}px solid transparent`, borderRight: `${tip}px solid transparent`, borderTop: `${tip}px solid ${CALLOUT_FILL}` }),
    ...(pointer === "left" && { borderTop: `${tip}px solid transparent`, borderBottom: `${tip}px solid transparent`, borderRight: `${tip}px solid ${CALLOUT_FILL}` }),
    ...(pointer === "right" && { borderTop: `${tip}px solid transparent`, borderBottom: `${tip}px solid transparent`, borderLeft: `${tip}px solid ${CALLOUT_FILL}` }),
  };
  const pill = (
    <span
      style={{
        display: "block",
        padding: "3px 9px",
        borderRadius: 999,
        background: CALLOUT_FILL,
        color: "#1c1c1e",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
      }}
    >
      {children}
    </span>
  );
  const first = pointer === "up" || pointer === "left";
  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        zIndex: 20,
        filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))",
      }}
    >
      {pointer && first ? <span style={triangle} /> : null}
      {pill}
      {pointer && !first ? <span style={triangle} /> : null}
    </span>
  );
}

/** LayoutHotkeysStepView keycap. */
export function Keycap({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 6px",
        borderRadius: 4,
        background: "var(--tu-input)",
        boxShadow: "inset 0 0 0 1px var(--tu-border-medium)",
        color: "var(--tu-text-1)",
        fontFamily: "var(--tu-font-rounded)",
        fontSize: 11,
        lineHeight: "13px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
