import type { ReactNode } from "react";

/**
 * A small vertical routine graph in the desktop app's style, drawn ink on
 * cream for the editorial sections (the hero draws the same pieces dark on
 * dark). Geometry follows the hero graph and
 * docs/promos/2026-10-29-graph-connections/spec/app-graph-design.md: 48px
 * cards with radius 10 and a 1.5px inside border, solid step-chain links with
 * hollow ports, dashed "consumes" links (6/4) to a dashed (2/6) capsule of
 * account tiles.
 *
 * Presentational only (no hooks), so server and client sections can share
 * it. The caller owns the state of each row. A row may carry trailing card
 * content (`end`, e.g. a counter) and a `gate`: chips sitting on the link
 * below it, like the app's edge capsules (a contract, a fallback rule). The
 * whole graph is decorative: the surrounding copy carries the meaning.
 *
 * Logos: public/assets/logos, copied from the cleaned set in
 * docs/promos/2026-10-29-graph-connections/assets/logos (SOURCES.md there).
 */

export type LogoKey =
  | "claude"
  | "openai"
  | "linkedin"
  | "figma"
  | "higgsfield"
  | "threads"
  | "facebook"
  | "instagram";

/** draft: proposed, not yet real. idle: waiting. The rest are run states. */
export type RowState = "draft" | "idle" | "running" | "done" | "paused";

export type ChainRow = {
  title: string;
  tiles: readonly LogoKey[];
  /** Trailing card content, e.g. a lead counter. */
  end?: ReactNode;
  /** Chips on the link below this row (use .rg-chip). */
  gate?: ReactNode;
};

type Props = {
  rows: readonly ChainRow[];
  states: readonly RowState[];
  labels: { running: string; paused: string };
};

const CSS = `
.rg {
  --rg-ink: 29,28,25;
  display: grid; grid-template-columns: minmax(196px, max-content) 32px max-content;
  align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
}
.rg-row { display: contents; }

/* card: the app's 48px routine card, light-ground translation */
.rg-card {
  position: relative; z-index: 1; display: flex; align-items: center; gap: 8px;
  height: 50px; padding: 0 12px 0 12px; border-radius: 10px;
  border: 1.5px solid rgba(var(--rg-ink),0.11);
  background: rgba(255,255,255,0.7);
  color: rgba(var(--rg-ink),0.9); font-size: 13px; font-weight: 500;
  letter-spacing: -0.005em; white-space: nowrap;
  transition: border-color .4s ease, background-color .4s ease, opacity .4s ease;
}
.rg-glyph { width: 12px; height: 12px; flex-shrink: 0; color: #9a8573; }
.rg-title { flex: 1; }
.rg-end {
  margin-left: 10px; color: rgba(var(--rg-ink),0.58); font-size: 11.5px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
/* the running wash: lit from within, never outside the card */
.rg-card::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(to bottom, rgba(var(--rg-ink),0.07), transparent 60%);
  opacity: 0; transition: opacity .4s ease;
}
/* pinned top-trailing, as in the app, so a running card never changes width */
.rg-badge {
  position: absolute; top: -7px; right: 9px; z-index: 2;
  display: none; border-radius: 999px; padding: 2px 6px 1.5px;
  font-family: ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif;
  font-size: 8.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  line-height: 1.2;
}

.rg-row[data-state="draft"] .rg-card {
  border-style: dashed; border-color: rgba(var(--rg-ink),0.3);
  background: rgba(255,255,255,0.22); color: rgba(var(--rg-ink),0.5);
}
.rg-row[data-state="draft"] .rg-glyph { opacity: .5; }
/* running: white card, ink rim (top strong, bottom soft), breathing wash */
.rg-row[data-state="running"] .rg-card {
  border-color: transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(to bottom, rgba(var(--rg-ink),0.85), rgba(var(--rg-ink),0.3)) border-box;
}
.rg-row[data-state="running"] .rg-card::after { opacity: 1; animation: rg-breath 1.9s ease-in-out infinite alternate; }
.rg-row[data-state="running"] .rg-badge--run {
  display: block; color: rgba(var(--rg-ink),0.86);
  background: #fff; box-shadow: inset 0 0 0 .75px rgba(var(--rg-ink),0.45);
}
/* done: the app has no completion outline; the card just returns to its idle look */
/* paused: the app's caution orange, the only place it appears on the page */
.rg-row[data-state="paused"] .rg-card {
  border-color: rgba(255,149,0,0.85);
  background: linear-gradient(to bottom, rgba(255,149,0,0.09), rgba(255,255,255,0.95) 70%), #fff;
}
.rg-row[data-state="paused"] .rg-badge--pause {
  display: block; color: #b25a00;
  background: #fff7ec; box-shadow: inset 0 0 0 .75px rgba(255,149,0,0.7);
}
@keyframes rg-breath { from { opacity: .45; } to { opacity: 1; } }

/* step-chain link between cards, with hollow ports on both card edges */
.rg-link {
  grid-column: 1; justify-self: center; position: relative; z-index: 2;
  width: 1.2px; height: 30px; background: rgba(var(--rg-ink),0.24);
}
.rg-link::before, .rg-link::after, .rg-conn::before {
  content: ''; position: absolute; width: 6px; height: 6px; border-radius: 50%;
  background: #f6f4ef; box-shadow: inset 0 0 0 1px rgba(var(--rg-ink),0.32);
}
.rg-link::before { top: -3px; left: -2.4px; }
.rg-link::after { bottom: -3px; left: -2.4px; }
/* a gate: chips centred on the link, the line hidden behind them */
.rg-link[data-gate] { height: 64px; }
.rg-gate {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; align-items: center; gap: 6px; white-space: nowrap;
}
.rg-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px 0 7px;
  border-radius: 999px; background: #fbfaf7;
  box-shadow: inset 0 0 0 1px rgba(var(--rg-ink),0.14);
  color: rgba(var(--rg-ink),0.72); font-size: 11px; font-weight: 600; white-space: nowrap;
  transition: box-shadow .3s ease, color .3s ease, background-color .3s ease;
}
.rg-chip svg { width: 12px; height: 12px; flex-shrink: 0; color: rgba(var(--rg-ink),0.55); }
.rg-chip-tick { display: none; }
.rg-chip[data-s="met"] { background: #fff; box-shadow: inset 0 0 0 1px rgba(var(--rg-ink),0.42); color: rgba(var(--rg-ink),0.9); }
.rg-chip[data-s="met"] .rg-chip-tick { display: block; color: rgba(var(--rg-ink),0.8); animation: rg-pop .35s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes rg-pop { from { transform: scale(.4); opacity: 0; } }
.rg-link[data-draft] {
  background: repeating-linear-gradient(to bottom, rgba(var(--rg-ink),0.28) 0 6px, transparent 6px 10px);
}

/* "consumes" link from the card's right edge to its account capsule */
.rg-conn {
  position: relative; z-index: 2; height: 1.2px; color: rgba(var(--rg-ink),0.3);
  background: repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 10px);
  transition: color .4s ease;
}
.rg-conn::before { left: -3px; top: -2.4px; }
.rg-row[data-state="running"] .rg-conn { color: rgba(var(--rg-ink),0.62); animation: rg-flow .7s linear infinite; }
@keyframes rg-flow { to { background-position: 10px 0; } }

/* account capsule: dashed 2/6 ring, like the hero's */
.rg-cap {
  position: relative; display: flex; gap: 7px; padding: 6px; justify-self: start;
  transition: opacity .4s ease;
}
.rg-cap-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.rg-cap-ring rect {
  fill: rgba(255,255,255,0.18); stroke: rgba(var(--rg-ink),0.3);
  stroke-width: 1.25; stroke-dasharray: 2 6;
}
.rg-tile {
  position: relative; display: grid; place-items: center;
  width: 40px; height: 40px; border-radius: 11px; background: #fff;
  box-shadow: inset 0 0 0 .7px rgba(var(--rg-ink),0.12),
    0 1px 2px rgba(0,0,0,0.05), 0 2px 9px rgba(0,0,0,0.07);
  transition: box-shadow .35s ease;
}
.rg-tile img { width: 22px; height: 22px; object-fit: contain; display: block; }
.rg-row[data-state="draft"] .rg-cap { opacity: .4; }
.rg-row[data-state="draft"] .rg-tile { box-shadow: inset 0 0 0 .7px rgba(var(--rg-ink),0.16); }
/* a running card pings the accounts it is using */
.rg-row[data-state="running"] .rg-tile {
  box-shadow: inset 0 0 0 1px rgba(var(--rg-ink),0.55),
    0 1px 2px rgba(0,0,0,0.05), 0 2px 9px rgba(0,0,0,0.07);
}
.rg-row[data-state="running"] .rg-tile::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: 0 0 0 1px rgba(var(--rg-ink),0.4);
  animation: rg-ping 1.4s ease-out infinite;
}
@keyframes rg-ping { from { transform: scale(1); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }

@media (max-width: 640px) {
  .rg { grid-template-columns: minmax(0, max-content) 18px max-content; }
  .rg-card { height: auto; min-height: 44px; padding: 8px 10px; gap: 7px; font-size: 12px; white-space: normal; line-height: 1.25; }
  .rg-cap { gap: 5px; padding: 5px; }
  .rg-tile { width: 31px; height: 31px; border-radius: 9px; }
  .rg-tile img { width: 17px; height: 17px; }
  .rg-link { height: 22px; }
  .rg-link[data-gate] { height: 84px; }
  .rg-gate { flex-direction: column; gap: 5px; }
  .rg-chip { height: 22px; font-size: 10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .rg-card, .rg-card::after, .rg-conn, .rg-cap, .rg-tile { transition: none; }
  .rg-row[data-state="running"] .rg-card::after,
  .rg-row[data-state="running"] .rg-conn { animation: none; }
  .rg-row[data-state="running"] .rg-tile::after { display: none; }
  .rg-chip { transition: none; }
  .rg-chip[data-s="met"] .rg-chip-tick { animation: none; }
}
`;

/** list.bullet.rectangle, the app's routine-kind glyph (as in the hero). */
function RoutineGlyph() {
  return (
    <svg className="rg-glyph" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x=".6" y="1.4" width="8.8" height="7.2" rx="1.6" fill="none" stroke="currentColor" strokeWidth=".9" />
      <circle cx="2.9" cy="3.9" r=".6" />
      <circle cx="2.9" cy="6.1" r=".6" />
      <path d="M4.4 3.9h3M4.4 6.1h3" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
    </svg>
  );
}

export function LogoTile({ logo }: { logo: LogoKey }) {
  return (
    <span className="rg-tile">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/logos/${logo}.svg`} alt="" width={21} height={21} />
    </span>
  );
}

export default function RoutineChain({ rows, states, labels }: Props) {
  return (
    <div className="rg" aria-hidden="true">
      <style href="routine-chain" precedence="default">{CSS}</style>
      {rows.map((row, i) => (
        <div className="rg-row" data-state={states[i]} key={row.title}>
          {i > 0 && (
            <span
              className="rg-link"
              data-draft={states[i] === "draft" ? "" : undefined}
              data-gate={rows[i - 1].gate ? "" : undefined}
            >
              {rows[i - 1].gate && <span className="rg-gate">{rows[i - 1].gate}</span>}
            </span>
          )}
          {i > 0 && <span />}
          {i > 0 && <span />}
          <div className="rg-card">
            <RoutineGlyph />
            <span className="rg-title">{row.title}</span>
            {row.end != null && <span className="rg-end">{row.end}</span>}
            <span className="rg-badge rg-badge--run">{labels.running}</span>
            <span className="rg-badge rg-badge--pause">{labels.paused}</span>
          </div>
          <span className="rg-conn" />
          <div className="rg-cap">
            <svg className="rg-cap-ring">
              <rect width="100%" height="100%" rx="18" />
            </svg>
            {row.tiles.map((logo) => (
              <LogoTile logo={logo} key={logo} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
