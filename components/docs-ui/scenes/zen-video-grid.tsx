import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Zen Mode, scrolled to the last "Ambient Video" category,
 * "Nature", with Mountain Wilds selected, and the section footer. The
 * "Hotkey" section below it is its own figure, settings-zen-toggle-hotkey
 * (placed where the guide talks about the shortcut), so this crop ends at the
 * Ambient Video footer.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/ZenMode/Views/ZenModeSettingsView.swift:13-16 (two flexible
 *   grid columns, spacing Spacing.md 16); :30-55 (category VStack: title
 *   Typography.Panel.subtitle 13 regular, spacing Spacing.sm 8; categories
 *   spaced Spacing.lg 24; footer copy);
 *   :81-131 (ZenVideoCard: 16:9 thumbnail, title .body medium textPrimary,
 *   lineLimit 1, checkmark.circle.fill IconSize.small 16 in the accent when
 *   selected, padding Spacing.sm 8; background inputBackground .5; r12;
 *   stroke accent 2pt when selected, else threadCardBorder 1pt).
 * - Features/ZenMode/Models/ZenVideo.swift:9-18 (categories in order, the
 *   title is rawValue.capitalized), :168-189 + :191-209 (Nature = Earthscapes,
 *   Norway, Mountain Wilds, in that order).
 *
 * Code vs plan: the plan puts Mountain Wilds "next to Norway". Nature has
 * three videos in catalogue order, so the grid reads Earthscapes | Norway on
 * the first row and Mountain Wilds alone on the second. Thumbnails are neutral
 * grey stand-ins, not the bundled frames (plan §1, contract).
 *
 * CALIBRATE: grouped Form geometry.
 */

/** Flat neutral/warm grey landscape stand-in for a bundled 16:9 frame. */
function Thumb({ variant }: { variant: 0 | 1 | 2 }) {
  const sky = [
    ["#8d8a85", "#5f5d5a"],
    ["#7f8083", "#55575a"],
    ["#918b83", "#64605b"],
  ][variant];
  const ridges = [
    // Earthscapes: low rolling horizon
    ["M0 62 C30 54 55 58 80 52 S130 46 160 54 L160 90 L0 90 Z", "M0 74 C40 66 70 72 100 66 S140 64 160 70 L160 90 L0 90 Z"],
    // Norway: fjord walls
    ["M0 40 L28 30 L52 58 L0 70 Z M160 34 L126 28 L104 58 L160 70 Z", "M0 70 L160 70 L160 90 L0 90 Z"],
    // Mountain Wilds: peaks
    ["M0 64 L34 34 L54 50 L84 22 L118 56 L138 42 L160 58 L160 90 L0 90 Z", "M0 76 L40 60 L80 72 L120 62 L160 74 L160 90 L0 90 Z"],
  ][variant];
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block", width: "100%", aspectRatio: "16 / 9" }}
      viewBox="0 0 160 90"
    >
      <defs>
        <linearGradient id={`zen-sky-${variant}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect fill={`url(#zen-sky-${variant})`} height="90" width="160" />
      <path d={ridges[0]} fill="#4a4845" />
      <path d={ridges[1]} fill="#383634" />
    </svg>
  );
}

function VideoCard({ title, variant, selected }: { title: string; variant: 0 | 1 | 2; selected?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "color-mix(in srgb, var(--tu-input) 50%, transparent)",
      }}
    >
      <Thumb variant={variant} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
        <span style={{ flex: "1 1 auto", fontSize: 13, fontWeight: 500, lineHeight: "16px", color: "var(--tu-text-1)" }}>
          {title}
        </span>
        {selected ? (
          <Glyph
            color="var(--tu-accent)"
            name="checkmark.circle.fill"
            size={16}
            style={{ ["--tu-glyph-knockout" as string]: "#2a2a2c" }}
          />
        ) : null}
      </div>
      {/* stroke drawn over the content, like SwiftUI's .overlay */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          boxShadow: selected
            ? "inset 0 0 0 2px var(--tu-accent)"
            : "inset 0 0 0 1px var(--tu-card-border)",
        }}
      />
    </div>
  );
}

function ZenVideoGrid() {
  return (
    <SettingsWindow formPaddingTop={0} selected="zenMode">
      <SettingsSection
        cutTop
        footer="The video displayed behind your panels when Zen Mode is active."
      >
        <SettingsRow style={{ display: "block", padding: "14px 10px 10px" }}>
          <div style={{ fontSize: 13, lineHeight: "16px", color: "var(--tu-label-1)", marginBottom: 8 }}>Nature</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <VideoCard title="Earthscapes" variant={0} />
            <VideoCard title="Norway" variant={1} />
            <VideoCard selected title="Mountain Wilds" variant={2} />
          </div>
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "zen-video-grid",
  width: 640,
  radius: 24,
  label:
    "Settings, Zen Mode page. The Ambient Video section shows the Nature category as a two-column grid of video cards: Earthscapes, Norway and Mountain Wilds, which is selected with an accent outline and a check mark.",
  caption: "Settings → Zen Mode: pick the ambient video.",
  Component: ZenVideoGrid,
};
