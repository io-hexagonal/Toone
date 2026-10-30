import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { Sheet, SheetFooter, SheetStage } from "../Sheet";

/**
 * The API key sheet Settings → MCPs opens from "API key…" on a server that
 * needs a credential: GitHub, with a token typed into the secure field.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Organization/Views/MCPSectionView.swift:283-323
 *   (MCPKeyPromptSheet: VStack leading spacing Spacing.md 16, padding 24,
 *   background layoutStyle.popoverBackground = innerBackgroundColor
 *   (LayoutStyle.swift:395-397); title "<server> — <label ?? key>"
 *   .headline textPrimary; SecureField(key) .roundedBorder minWidth 320;
 *   caption textTertiary; HStack Cancel (.cancelAction) · Spacer · Save
 *   (.defaultAction, disabled while the field is blank)).
 * - Features/Settings/Views/MCPIntegrationsSettingsView.swift:106-116 (the
 *   "API key…" button builds the prompt from the entry's first required
 *   env key and its label).
 * - _mcp-catalog.json (repo root): GitHub's GITHUB_PERSONAL_ACCESS_TOKEN,
 *   label "GitHub personal access token" (the same row settings-global-mcps
 *   shows with "API key…").
 *
 * Code vs plan: the plan's "Brave Search — API key" is not in the catalogue
 * (no Brave Search entry), so the figure uses GitHub, whose title is built
 * from the catalogue label. The secure field holds a typed value (dots), so
 * Save is enabled.
 *
 * CALIBRATE: the sheet window (Sheet.tsx), the rounded-border secure field,
 * the push buttons and the default-button fill (drawn in the theme accent,
 * never system blue).
 */

const CONTENT_W = 320;
const SHEET_W = CONTENT_W + 48;
const WIDTH = SHEET_W + 48;

function McpApiKeySheet() {
  return (
    <SheetStage>
      <Sheet
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          background: "var(--tu-inner)",
        }}
        width={SHEET_W}
      >
        <span style={{ fontSize: 13, lineHeight: "16px", fontWeight: 700, color: "var(--tu-text-1)" }}>
          GitHub — GitHub personal access token
        </span>
        {/* SecureField .roundedBorder. CALIBRATE */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            height: 22,
            padding: "0 6px",
            borderRadius: 5,
            background: "rgba(255,255,255,0.05)",
            boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.22)",
            fontSize: 13,
            letterSpacing: 1,
            color: "var(--tu-label-1)",
          }}
        >
          ••••••••••••••••••••••••••
        </span>
        <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-text-3)" }}>
          Stored in your macOS Keychain and injected into the server&apos;s environment when its config is written. macOS
          may ask for permission when you save; Toone never sees your Mac password.
        </span>
        <SheetFooter leading={<PushButton label="Cancel" />} trailing={<PushButton label="Save" prominent />} />
      </Sheet>
    </SheetStage>
  );
}

export const scene: SceneDefinition = {
  id: "mcp-api-key-sheet",
  width: WIDTH,
  radius: 16,
  label:
    "A sheet titled GitHub, GitHub personal access token, with a secure field holding a hidden token. The note below says the key is stored in your macOS Keychain and injected into the server's environment, and that Toone never sees your Mac password. Buttons: Cancel and Save.",
  caption: "API key… asks for the server's credential and keeps it in your macOS Keychain.",
  Component: McpApiKeySheet,
};
