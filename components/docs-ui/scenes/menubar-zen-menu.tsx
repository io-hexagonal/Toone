import { Glyph } from "../glyphs";
import { Menu, type MenuItem } from "../Menu";
import type { SceneDefinition } from "../scene";

/**
 * The Toone menu-bar item's right-click menu while Zen mode is active, over
 * the ambient video (a neutral grey stand-in). "Mute Audio" is highlighted.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - App/AppDelegate.swift:549-631 (menuBarClicked: right-click or
 *   control-click builds an NSMenu: update item + separator; while Zen is
 *   active a disabled "Zen Mode" item, "Mute Audio" / "Unmute Audio", "Exit
 *   Zen Mode", separator; "Speech Language" with a locale submenu;
 *   "Settings..." ⌘, (three full stops in the code); "Content Library";
 *   "What's New…" only when a release note is available; "Guided Tour…";
 *   separator; "Quit Toone" ⌘Q).
 * - App/AppDelegate.swift:970-1023 (addUpdateMenuItems: with no update
 *   pending, "Check for Updates…" with the arrow.clockwise symbol, then a
 *   separator).
 * - App/AppDelegate.swift:416 + Assets.xcassets/MenuBarIcon.imageset (18pt
 *   template image: a hexagon ring of six segments around a hexagon),
 *   drawn here as a simple lookalike.
 *
 * Code vs plan: the plan lists only the Zen items, Speech Language and
 * Settings; the real menu also has Check for Updates…, Content Library,
 * Guided Tour… and Quit Toone, so the whole menu is drawn. "What's New…" is
 * left out (shown only when the catalogue has a release to show).
 *
 * CALIBRATE: NSMenu geometry (Menu.tsx), the menu bar strip's material and
 * height, the status item's pressed highlight, and the menu's offset under
 * the bar.
 */

const ITEMS: MenuItem[] = [
  { label: "Check for Updates…", icon: "arrow.clockwise" },
  "separator",
  { label: "Zen Mode", disabled: true },
  { label: "Mute Audio", highlighted: true },
  { label: "Exit Zen Mode" },
  "separator",
  { label: "Speech Language", submenu: true },
  { label: "Settings...", shortcut: "⌘," },
  { label: "Content Library" },
  { label: "Guided Tour…" },
  "separator",
  { label: "Quit Toone", shortcut: "⌘Q" },
];

const WIDTH = 400;
const BAR = 24;
const ICON_X = 132;

/** The Toone menu-bar mark: six ring segments around a hexagon (template image). */
function TooneMark() {
  const ring = [0, 1, 2, 3, 4, 5].map((i) => {
    const a0 = ((i * 60 - 90 + 4) * Math.PI) / 180;
    const a1 = (((i + 1) * 60 - 90 - 4) * Math.PI) / 180;
    const p = (r: number, a: number) => `${(8 + r * Math.cos(a)).toFixed(2)} ${(8 + r * Math.sin(a)).toFixed(2)}`;
    return { d: `M${p(7.4, a0)} L${p(7.4, a1)} L${p(4.6, a1)} L${p(4.6, a0)} Z`, o: i % 2 ? 1 : 0.5 };
  });
  const hex = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = ((i * 60 - 90) * Math.PI) / 180;
      return `${(8 + 3.3 * Math.cos(a)).toFixed(2)} ${(8 + 3.3 * Math.sin(a)).toFixed(2)}`;
    })
    .join(" L");
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
      {ring.map((s, i) => (
        <path d={s.d} fill="#fff" fillOpacity={s.o} key={i} />
      ))}
      <path d={`M${hex} Z`} fill="#fff" />
    </svg>
  );
}

/** The ambient video behind everything while Zen is on: a flat grey landscape stand-in. */
function ZenBackdrop() {
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 400 330"
    >
      <defs>
        <linearGradient id="menubar-zen-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8a8782" />
          <stop offset="1" stopColor="#57554f" />
        </linearGradient>
      </defs>
      <rect fill="url(#menubar-zen-sky)" height="330" width="400" />
      <path d="M0 236 L70 168 L118 206 L190 130 L262 214 L312 180 L400 226 L400 330 L0 330 Z" fill="#4a4845" />
      <path d="M0 282 L90 248 L180 274 L280 252 L400 280 L400 330 L0 330 Z" fill="#383634" />
    </svg>
  );
}

function MenubarZenMenu() {
  return (
    <div style={{ position: "relative", height: 308, overflow: "hidden" }}>
      <ZenBackdrop />
      {/* menu bar strip. CALIBRATE */}
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: BAR,
          display: "flex",
          alignItems: "center",
          background: "rgba(28, 28, 30, 0.55)",
          boxShadow: "inset 0 -0.5px 0 rgba(0,0,0,0.35)",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: ICON_X - 6,
            top: 2,
            width: 30,
            height: 20,
            borderRadius: 5,
            background: "rgba(255,255,255,0.2)",
          }}
        />
        <span style={{ position: "absolute", left: ICON_X + 1, top: 4, display: "inline-flex" }}>
          <TooneMark />
        </span>
        <span style={{ position: "absolute", left: ICON_X + 44, top: 5, display: "inline-flex", color: "#fff" }}>
          <Glyph name="magnifyingglass" size={14} weight="medium" />
        </span>
      </div>
      <Menu items={ITEMS} style={{ position: "absolute", left: ICON_X - 6, top: BAR + 3, minWidth: 214 }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "menubar-zen-menu",
  width: WIDTH,
  radius: 16,
  label:
    "The Toone menu-bar item's menu while Zen mode is on, over the ambient video. Check for Updates; then a greyed-out Zen Mode heading with Mute Audio highlighted and Exit Zen Mode; then Speech Language, Settings, Content Library and Guided Tour; then Quit Toone.",
  caption: "Right-click the Toone menu-bar icon to mute the Zen audio or leave Zen mode.",
  Component: MenubarZenMenu,
};
