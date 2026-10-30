import type { CSSProperties } from "react";

/**
 * Keycap: one key of a shortcut, as the Setup window draws it.
 *
 * Source: apps/toone-desktop/Toone/Toone/Features/Setup/Views/
 * LayoutHotkeysStepView.swift:74-88: Text 11pt medium rounded, textPrimary,
 * padding 6/3, RoundedRectangle r4 filled with the theme's inputBackground,
 * 1pt AppColors.borderMedium (white .20) stroke. Keys of one shortcut sit in
 * an HStack(spacing 4).
 */
export function Keycap({ children, style }: { children: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 6px",
        borderRadius: 4,
        background: "var(--tu-input)",
        boxShadow: "inset 0 0 0 1px var(--tu-border-medium)",
        fontFamily: "var(--tu-font-rounded)",
        fontSize: 11,
        lineHeight: "13px",
        fontWeight: 500,
        color: "var(--tu-text-1)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Several keys of one shortcut: HStack(spacing 4). */
export function KeyCombo({ keys, style }: { keys: string[]; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, ...style }}>
      {keys.map((k) => (
        <Keycap key={k}>{k}</Keycap>
      ))}
    </span>
  );
}
