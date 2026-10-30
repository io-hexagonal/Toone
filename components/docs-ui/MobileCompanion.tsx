import type { CSSProperties, ReactNode } from "react";
import { Glyph, type GlyphName } from "./glyphs";

/*
 * Primitives for the iPhone companion (apps/toone-mobile on the monorepo's
 * main), a different design system from the desktop (iOS 26). The phone
 * follows the desktop's theme (ThemeStore / AppSessionState.layoutStyle), so
 * these are the Smoky Quartz (`.neutralGlass`) values of
 * Presentation/DesignSystem/Theme/ThemeTokens.swift: darkBase white .08,
 * elevatedSurface white .12, cardBorder = white × (.15 × .5), text white
 * .95 / .70 / .45, accent white .72 (= --tu-accent), chip fill tint .12.
 *
 * Geometry (DesignTokens.swift): screen gutter 16, card padding 16,
 * card radius 26 (continuous), section header ≥44 tall with 4pt side
 * padding, chip insets small 2/6 · regular 4/8, recent-thread card 240 wide,
 * carousel spacing 12, status dot 8. Type (Typography.swift Role, iOS
 * default sizes): large title 34 bold, row title 17 semibold, meta 15,
 * footnote 13, section header 13 semibold uppercase (tracking .3), badge 12
 * semibold.
 *
 * The phone itself is a plain neutral outline (no device artwork, no
 * island), drawn at iPhone 17 Pro points (402 × 874).
 */

export const PHONE = { width: 402, height: 874 } as const;
const BEZEL = 10;

export const M = {
  base: "#141414",
  surface: "#1f1f1f",
  cardBorder: "rgba(255, 255, 255, 0.075)",
  text1: "rgba(255, 255, 255, 0.95)",
  text2: "rgba(255, 255, 255, 0.7)",
  text3: "rgba(255, 255, 255, 0.45)",
  accent: "var(--tu-accent)",
} as const;

/** A neutral phone outline around a 402 × 874 screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: PHONE.width + BEZEL * 2,
        height: PHONE.height + BEZEL * 2,
        padding: BEZEL,
        borderRadius: 66,
        background: "#1c1c1e",
        boxShadow: "inset 0 0 0 3px #6e6e73",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: 56,
          overflow: "hidden",
          background: M.base,
          color: M.text1,
          fontFamily: "var(--tu-font)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Status bar: the time and a battery; nothing device-specific. */
export function IOSStatusBar({ time }: { time: string }) {
  return (
    <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 34px 0 50px" }}>
      <span style={{ fontSize: 17, lineHeight: "22px", fontWeight: 600 }}>{time}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <span style={{ position: "relative", width: 26, height: 13, borderRadius: 4, boxShadow: `inset 0 0 0 1.2px ${M.text3}` }}>
          <span style={{ position: "absolute", left: 2.5, top: 2.5, bottom: 2.5, width: 16, borderRadius: 2, background: M.text1 }} />
        </span>
        <span style={{ width: 2, height: 5, borderRadius: 1, background: M.text3 }} />
      </span>
    </div>
  );
}

/** Root-tab navigation bar: trailing glass toolbar button, then the large title. */
export function IOSLargeTitle({ title, trailingIcon }: { title: string; trailingIcon?: GlyphName }) {
  return (
    <div>
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 16px" }}>
        {trailingIcon ? (
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.1)",
              boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.12)",
              color: M.text1,
            }}
          >
            <Glyph name={trailingIcon} size={20} weight="medium" />
          </span>
        ) : null}
      </div>
      <div style={{ padding: "2px 16px 6px", fontSize: 34, lineHeight: "41px", fontWeight: 700, letterSpacing: 0.4 }}>{title}</div>
    </div>
  );
}

/** TooneChip: tinted capsule, badge text, optional spinner. */
export function MobileChip({
  label,
  tint = M.text2,
  size = "small",
  spinner = false,
}: {
  label: string;
  tint?: string;
  size?: "small" | "regular";
  spinner?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "small" ? "2px 6px" : "4px 8px",
        borderRadius: 999,
        color: tint,
        background: `color-mix(in srgb, ${tint} 12%, transparent)`,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        flex: "none",
      }}
    >
      {spinner ? <Spinner color={tint} /> : null}
      {label}
    </span>
  );
}

/** A still activity indicator (the system spinner's spokes, static). */
function Spinner({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" height="12" viewBox="0 0 16 16" width="12">
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          opacity={0.25 + (i / 8) * 0.75}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="1.8"
          transform={`rotate(${i * 45} 8 8)`}
          x1="8"
          x2="8"
          y1="1.8"
          y2="4.6"
        />
      ))}
    </svg>
  );
}

/** TooneSectionHeader: uppercase title, optional count chip, accessory, disclosure chevron. */
export function MobileSectionHeader({
  title,
  count,
  accessory,
  expanded,
}: {
  title: string;
  count?: number;
  accessory?: ReactNode;
  /** Collapsible form: chevron.right, rotated 90° when expanded. */
  expanded?: boolean;
}) {
  return (
    <div style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
      <span
        style={{
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          color: M.text2,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      {count !== undefined ? <MobileChip label={String(count)} /> : null}
      <span style={{ flex: 1 }} />
      {accessory}
      {expanded !== undefined ? (
        <Glyph
          color={M.text3}
          name="chevron.right"
          size={13}
          style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          weight="semibold"
        />
      ) : null}
    </div>
  );
}

const cardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 26,
  background: M.surface,
  boxShadow: `inset 0 0 0 1px ${M.cardBorder}`,
  boxSizing: "border-box",
};

const clamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

/** ThreadCarousel: a row that bleeds past the right gutter. */
export function ThreadCarousel({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "stretch", gap: 12, marginRight: -16 }}>{children}</div>;
}

function CardHeader({ dot, agent, time }: { dot?: string; agent: string; time: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 18 }}>
      {dot ? <span style={{ width: 8, height: 8, borderRadius: 4, background: dot, flex: "none" }} /> : null}
      <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: M.text2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {agent}
      </span>
      <span style={{ flex: 1, minWidth: 4 }} />
      <span style={{ fontSize: 13, lineHeight: "18px", color: M.text2, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{time}</span>
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "block", fontSize: 17, lineHeight: "22px", fontWeight: 600, color: M.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {children}
    </span>
  );
}

function CardMeta({ children, lines = 2 }: { children: ReactNode; lines?: number }) {
  return (
    <span style={{ fontSize: 15, lineHeight: "20px", minHeight: lines * 20, color: M.text2, ...clamp(lines) }}>{children}</span>
  );
}

/** RecentThreadCard (240 wide, two preview lines always reserved). */
export function RecentThreadCard({ agent, title, preview, time, dot = M.text3 }: { agent: string; title: string; preview: string; time: string; dot?: string }) {
  return (
    <div style={{ ...cardStyle, width: 240, flex: "none", display: "flex", flexDirection: "column", gap: 4 }}>
      <CardHeader agent={agent} dot={dot} time={time} />
      <CardTitle>{title}</CardTitle>
      <CardMeta>{preview}</CardMeta>
    </div>
  );
}

/** SystemThreadCard (carousel layout): agent, routine · step, status line, lifecycle chip. */
export function SystemThreadCard({ agent, title, summary, time, status }: { agent: string; title: string; summary: string; time: string; status: string }) {
  return (
    <div style={{ ...cardStyle, width: 240, flex: "none", display: "flex", flexDirection: "column", gap: 4 }}>
      <CardHeader agent={agent} time={time} />
      <CardTitle>{title}</CardTitle>
      <CardMeta>{summary}</CardMeta>
      <span style={{ paddingTop: 2 }}>
        <MobileChip label={status} spinner tint={M.accent} />
      </span>
    </div>
  );
}

/** AgentCard: status dot, name (+ chips), description, thread count, chevron. */
export function MobileAgentCard({
  name,
  description,
  threads,
  dot,
  current = false,
}: {
  name: string;
  description: string;
  threads: number;
  dot: string;
  current?: boolean;
}) {
  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: dot, flex: "none", marginTop: 8 }} />
      <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CardTitle>{name}</CardTitle>
          {current ? <MobileChip label="Current" tint={M.accent} /> : null}
        </span>
        <span style={{ fontSize: 15, lineHeight: "20px", color: M.text2, ...clamp(2) }}>{description}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, paddingTop: 2, fontSize: 13, lineHeight: "18px", color: M.text2 }}>
          <Glyph name="bubble.left.and.bubble.right" size={14} />
          {threads === 1 ? "1 thread" : `${threads} threads`}
        </span>
      </span>
      <Glyph color={M.text3} name="chevron.right" size={14} style={{ marginTop: 5 }} weight="semibold" />
    </div>
  );
}

export type MobileTab = { title: string; icon: GlyphName };

/** iOS 26 floating glass tab bar; the selected tab sits in a lighter capsule, tinted with the accent. */
export function IOSTabBar({ tabs, selected }: { tabs: MobileTab[]; selected: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 26,
        height: 62,
        padding: 4,
        borderRadius: 31,
        display: "flex",
        background: "rgba(44, 44, 46, 0.92)",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.12), 0 8px 24px rgba(0, 0, 0, 0.35)",
        boxSizing: "border-box",
      }}
    >
      {tabs.map((tab) => {
        const on = tab.title === selected;
        return (
          <span
            key={tab.title}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              borderRadius: 27,
              background: on ? "rgba(255, 255, 255, 0.12)" : undefined,
              color: on ? M.accent : M.text1,
            }}
          >
            <Glyph name={tab.icon} size={22} weight="medium" />
            <span style={{ fontSize: 10, lineHeight: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>{tab.title}</span>
          </span>
        );
      })}
    </div>
  );
}
