import type { CSSProperties } from "react";
import { Button } from "../Button";
import { ProviderMark, type ProviderMarkName } from "../ProviderMark";
import type { SceneDefinition } from "../scene";

/**
 * Setup window, "Choose your AI" step (Direct edition): Anthropic "Ready" and
 * selected, OpenAI "Not found" with the "Recommended" badge, and the Continue
 * button. Cropped to the step's scroll content; banner, the shell-search link
 * below Continue and the window chrome are left out.
 *
 * calibrate: the Setup window surface (theme blur + overlay) is drawn with
 * the frozen --tu-panel fill.
 */

const WIDTH = 588;
const INSET = (WIDTH - 556) / 2; // the step's content is 620 − 2 × 32 wide

type Card = {
  name: string;
  mark: ProviderMarkName;
  description: string;
  status: string;
  ready: boolean;
  selected: boolean;
  recommended: boolean;
};

const CARDS: Card[] = [
  {
    name: "Anthropic",
    mark: "anthropic",
    description: "Use an Anthropic account with access to Claude Code.",
    status: "Ready",
    ready: true,
    selected: true,
    recommended: false,
  },
  {
    name: "OpenAI",
    mark: "openai",
    description: "Use an OpenAI account with access to Codex.",
    status: "Not found",
    ready: false,
    selected: false,
    recommended: true,
  },
];

const center: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center" };

function ProviderCard({ card }: { card: Card }) {
  return (
    <div style={{ flex: "1 1 0", height: 180, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          ...center,
          position: "relative",
          alignSelf: "stretch",
          height: 120,
          borderRadius: 12,
          background: `rgba(255,255,255,${card.selected ? 0.06 : 0.02})`,
          // stroke centred on the edge, then clipped: only the inner half shows
          boxShadow: card.selected
            ? "inset 0 0 0 0.75px rgba(255,255,255,0.3)"
            : "inset 0 0 0 0.5px rgba(255,255,255,0.08)",
        }}
      >
        <ProviderMark name={card.mark} size={40} style={{ color: "#fff", opacity: 0.8 }} />
        <span
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 10px",
            borderRadius: 7,
            background: "rgba(0,0,0,0.2)",
            outline: `1px solid rgba(255,255,255,${card.ready ? 0.22 : 0.12})`,
            outlineOffset: -0.5,
            fontSize: 9,
            fontWeight: 600,
            lineHeight: "11px",
            whiteSpace: "nowrap",
            color: `rgba(255,255,255,${card.ready ? 0.85 : 0.72})`,
          }}
        >
          {card.status}
        </span>
      </div>
      <div style={{ ...center, gap: 6, marginTop: 10, height: 17 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{card.name}</span>
        {card.recommended ? (
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
      </div>
      <p
        style={{
          margin: "4px 0 0",
          height: 28,
          alignSelf: "stretch",
          fontSize: 11,
          lineHeight: "14px",
          textAlign: "center",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {card.description}
      </p>
    </div>
  );
}

function SetupProviderCards() {
  return (
    <div
      style={{
        padding: `20px ${INSET}px 20px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tu-text-1)" }}>Choose your AI</span>
        <span style={{ maxWidth: 460, fontSize: 12, lineHeight: "15px", textAlign: "center", color: "var(--tu-text-2)" }}>
          Toone works with either provider. Ready tools can continue now; Toone can install a missing tool for you.
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, alignSelf: "stretch" }}>
        {CARDS.map((card) => (
          <ProviderCard card={card} key={card.name} />
        ))}
      </div>
      <Button
        icon="arrow.right.circle"
        iconSize={15}
        label="Continue"
        style={{
          padding: "8px 16px",
          gap: 6,
          color: "#fff",
          // .stroke(white .2, 1): centred on the edge, not clipped
          boxShadow: "none",
          outline: "1px solid rgba(255,255,255,0.2)",
          outlineOffset: -0.5,
        }}
        variant="setup"
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-provider-cards",
  width: WIDTH,
  radius: 16,
  label:
    "Toone setup, Choose your AI. Two provider cards side by side: Anthropic, marked Ready and selected, and OpenAI, marked Not found and Recommended. A Continue button sits below the cards.",
  caption: "Setup shows which provider tools it found. Pick a ready one and choose Continue.",
  Component: SetupProviderCards,
};
