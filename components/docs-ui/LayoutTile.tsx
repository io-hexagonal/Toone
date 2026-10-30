import type { CSSProperties, ReactNode } from "react";
import { Miniature, SCREEN, panelFrames, type PanelLayoutId, type Rect } from "./Miniature";

/*
 * A schematic screen tile: one panel layout at its real FloatingPanel
 * frames (panelFrames), drawn in the vocabulary of scenes/panel-layouts.tsx
 * (Setup's PanelLayoutMockup, LayoutHotkeysStepView.swift:273-387: screen
 * black .4 r6 + white .1 stroke; chat accent .25, project accent .15, panel
 * border white .15), but large enough to carry "greeked" panel contents:
 * the same conversation (strip, rail, header, two bubbles, composer) and the
 * same file tree in every tile, as grey shapes at the app's point sizes
 * (strip / rail / header 44, bubble 36, composer field 40, tree row 32), so
 * a reader can follow one conversation from layout to layout.
 *
 * The whole screen lays out at 1440 × 900 pt and <Miniature> scales it to
 * `width`; strokes are divided by the scale so they stay 1px.
 */

const MARK = "rgba(255, 255, 255, 0.24)";
const MARK_DIM = "rgba(255, 255, 255, 0.14)";
const MARK_BRIGHT = "rgba(255, 255, 255, 0.4)";

function bar(w: number | string, h: number, color: string, style?: CSSProperties) {
  return <span style={{ display: "block", flex: "none", width: w, height: h, borderRadius: Math.min(h / 2, 8), background: color, ...style }} />;
}

/** The chat panel as grey shapes: strip, rail, header, user + agent bubbles, composer. */
function GreekChat({ align }: { align: "top" | "bottom" }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 44, flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>
        {bar(130, 26, MARK_BRIGHT)}
        {bar(96, 26, MARK_DIM)}
        {bar(96, 26, MARK_DIM)}
      </div>
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", borderTop: `6px solid ${MARK_DIM}` }}>
        <div style={{ width: 44, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 14, overflow: "hidden" }}>
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i}>{bar(20, 20, i === 1 ? MARK_BRIGHT : MARK, { borderRadius: 5 })}</span>
          ))}
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: `6px solid ${MARK_DIM}` }}>
          <div style={{ height: 44, flex: "none", display: "flex", alignItems: "center", padding: "0 16px" }}>{bar(170, 14, MARK)}</div>
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: align === "bottom" ? "flex-end" : "flex-start",
              gap: 22,
              padding: "16px 16px 8px",
            }}
          >
            {bar("62%", 40, MARK_BRIGHT, { alignSelf: "flex-end", borderRadius: 12 })}
            {bar("72%", 40, MARK, { borderRadius: 12 })}
          </div>
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: 16 }}>
            {bar(74, 22, MARK)}
            {bar("100%", 40, MARK_DIM, { flex: "1 1 auto", width: "auto", borderRadius: 12 })}
            {bar(30, 30, MARK, { borderRadius: 15 })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Project Explorer as grey shapes: header, search field, a few tree rows. */
function GreekProject() {
  const rows: [number, number][] = [[0, 150], [1, 90], [1, 80], [2, 190], [1, 100], [1, 120], [1, 84]];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "14px 16px", gap: 18, overflow: "hidden" }}>
      {bar(170, 14, MARK)}
      {bar("100%", 32, MARK_DIM, { borderRadius: 12 })}
      {rows.map(([level, w], i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: level * 22 }}>
          {bar(18, 18, MARK, { borderRadius: 4 })}
          {bar(w, 12, i === 3 ? MARK_BRIGHT : MARK_DIM)}
        </span>
      ))}
    </div>
  );
}

function SchematicPanel({ rect, fill, scale, children }: { rect: Rect; fill: number; scale: number; children: ReactNode }) {
  return (
    <span
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: 24,
        overflow: "hidden",
        background: `color-mix(in srgb, var(--tu-accent) ${fill}%, transparent)`,
        boxShadow: `inset 0 0 0 ${1 / scale}px var(--tu-panel-border)`,
      }}
    >
      {children}
    </span>
  );
}

/** One layout as a schematic screen, `width` px wide (16:10). */
export function LayoutScreen({ layout, width }: { layout: PanelLayoutId; width: number }) {
  const scale = width / SCREEN.width;
  const frames = panelFrames(layout);
  return (
    <Miniature height={SCREEN.height} scale={scale} style={{ borderRadius: 6 }} width={SCREEN.width}>
      <div
        style={{
          position: "relative",
          width: SCREEN.width,
          height: SCREEN.height,
          background: "rgba(0, 0, 0, 0.4)",
          boxShadow: `inset 0 0 0 ${1 / scale}px rgba(255, 255, 255, 0.1)`,
          borderRadius: 6 / scale,
          overflow: "hidden",
        }}
      >
        {frames.project ? (
          <SchematicPanel fill={15} rect={frames.project} scale={scale}>
            <GreekProject />
          </SchematicPanel>
        ) : null}
        <SchematicPanel fill={25} rect={frames.chat} scale={scale}>
          <GreekChat align={layout === "fullHeight" || layout === "compact" || layout === "zen" ? "top" : "bottom"} />
        </SchematicPanel>
      </div>
    </Miniature>
  );
}
