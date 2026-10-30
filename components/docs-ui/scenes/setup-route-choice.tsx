import { Glyph, type GlyphName } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * Setup window, first step "Choose your setup": the Express and Complete
 * cards with Express selected (and "Recommended"), and the Express
 * footnote. The "Start Express setup" button below is left out (plan), as
 * are the banner and the window chrome.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Setup/Views/SetupFlowChoiceStepView.swift:27-44 (VStack spacing
 *   20, top padding 16), :48-61 (header: "Choose your setup" .headline;
 *   description 12 secondary, centred, max 460), :65-73 (footnote 11
 *   tertiary, centred, max 460, min-h 30), :105-133 (cards: HStack top
 *   spacing 12, equal width and height; VStack spacing 12, padding 14),
 *   :135-169 (header: HStack 10; 30² icon tile r8 iconColor .25 selected /
 *   .12; symbol 14 medium white .9 / .6; title 14 semibold white .85;
 *   tagline 11 white .45; VStack spacing 2), :171-178 ("Recommended" 8
 *   semibold white .82, padding 6/2, white .1 capsule), :180-198
 *   (highlights VStack 6; checkmark 9 semibold iconColor .9 / .5, spacing
 *   7; text 11 white .6), :200-211 (r12, fill white .06 / .02, stroke
 *   iconColor .55 @1.5 selected / white .08 @1), :216-263 (copy, icons
 *   bolt.fill / slider.horizontal.3).
 * - Features/Setup/Views/SetupView.swift:43-46,216 (window 620 wide,
 *   content margin 32 → 556).
 * - UI/Windows/LayoutStyle.swift:123-131 (iconColor, Smoky Quartz =
 *   white 0.72 = --tu-accent).
 *
 * Code vs plan: none.
 *
 * calibrate: the Setup window surface is drawn with the frozen --tu-panel.
 */

const WIDTH = 588;
const INSET = (WIDTH - 556) / 2;

type Flow = {
  title: string;
  tagline: string;
  icon: GlyphName;
  highlights: string[];
  selected: boolean;
  recommended: boolean;
};

const FLOWS: Flow[] = [
  {
    title: "Express",
    tagline: "Just the essentials",
    icon: "bolt.fill",
    highlights: ["Connect your AI provider", "Choose device permissions", "Learn the show / hide hotkey"],
    selected: true,
    recommended: true,
  },
  {
    title: "Complete",
    tagline: "Essentials plus customization",
    icon: "slider.horizontal.3",
    highlights: ["Everything in Express", "Pick your panel layout and theme", "Review essential keyboard shortcuts"],
    selected: false,
    recommended: false,
  },
];

const accent = (pct: number) => `color-mix(in srgb, var(--tu-accent) ${pct}%, transparent)`;

function FlowCard({ flow }: { flow: Flow }) {
  const { selected } = flow;
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        background: `rgba(255,255,255,${selected ? 0.06 : 0.02})`,
        // .stroke() overlay: centred on the edge
        outline: selected ? `1.5px solid ${accent(55)}` : "1px solid rgba(255,255,255,0.08)",
        outlineOffset: selected ? -0.75 : -0.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: accent(selected ? 25 : 12),
            color: `rgba(255,255,255,${selected ? 0.9 : 0.6})`,
          }}
        >
          <Glyph name={flow.icon} size={16} weight="medium" />
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: "17px", color: "rgba(255,255,255,0.85)" }}>
              {flow.title}
            </span>
            {flow.recommended ? (
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  fontSize: 8,
                  fontWeight: 600,
                  lineHeight: "10px",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                Recommended
              </span>
            ) : null}
          </span>
          <span
            style={{
              fontSize: 11,
              lineHeight: "13px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {flow.tagline}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {flow.highlights.map((h) => (
          <span key={h} style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <Glyph
              color={accent(selected ? 90 : 50)}
              name="checkmark"
              size={10}
              style={{ position: "relative", top: 1 }}
              weight="semibold"
            />
            <span style={{ fontSize: 11, lineHeight: "14px", color: "rgba(255,255,255,0.6)" }}>{h}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SetupRouteChoice() {
  return (
    <div
      style={{
        padding: `${16 + 8}px ${INSET}px 18px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "16px", color: "var(--tu-text-1)" }}>
          Choose your setup
        </span>
        <span style={{ maxWidth: 460, fontSize: 12, lineHeight: "15px", textAlign: "center", color: "var(--tu-text-2)" }}>
          Both routes connect your AI provider and device permissions. Complete also walks you through workspace
          customization.
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, alignSelf: "stretch" }}>
        {FLOWS.map((flow) => (
          <FlowCard flow={flow} key={flow.title} />
        ))}
      </div>
      <span
        style={{
          maxWidth: 460,
          minHeight: 30,
          fontSize: 11,
          lineHeight: "14px",
          textAlign: "center",
          color: "var(--tu-text-3)",
        }}
      >
        Express keeps your current workspace appearance. Layout, theme, and shortcuts stay adjustable in Settings.
      </span>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-route-choice",
  width: WIDTH,
  radius: 16,
  label:
    "Toone setup, Choose your setup. Two cards side by side: Express, Just the essentials, marked Recommended and selected, and Complete, Essentials plus customization. A note below says Express keeps your current workspace appearance.",
  caption: "Setup opens on a choice of route. Express covers the essentials and is the recommended start.",
  Component: SetupRouteChoice,
};
