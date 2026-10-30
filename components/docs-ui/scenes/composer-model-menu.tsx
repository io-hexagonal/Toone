import { ChatComposer } from "../Chat";
import { DEMO } from "../demo";
import { Menu, type MenuItem } from "../Menu";
import type { SceneDefinition } from "../scene";

/**
 * The composer's options menu, open from the model chip, in a Claude thread
 * set to Opus with High effort (chip "OPUS · HIGH"). Cropped after the
 * effort section; Ultracode and Microphone Language follow below it.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/ChatPanelView.swift:2781-2914 (inputOptionsMenu):
 *   Section "Mode": "Loop — auto-continues when idle", "Safe — redacts
 *   forbidden topics" (checkmark Label when on); Section "Model — Claude":
 *   "Use app default" (a plain Button, never checked), the alias models,
 *   then the "Pinned Versions" submenu; ReasoningEffortPicker inline;
 *   Section "Ultracode"; (Claude Account, only with several accounts);
 *   Section "Microphone Language" (7 languages + "Push to talk: hold ⌥A").
 *   :2963-2973 (modelButton: Label(name, systemImage: "checkmark") when
 *   selected). Label: :2890-2906, modelChipLabel :2916-2926.
 * - APP/Core/Services/AIService/Models/AISessionOptions.swift:45-60, 85-110,
 *   265-276 (Claude aliases in order: Fable, Opus, Sonnet, Haiku).
 * - APP/UI/Components/ReasoningEffortPicker.swift:63-80 (inline Picker
 *   "Effort": the inherited label, then the model's levels);
 *   APP/Core/Services/AIService/Models/AIReasoningEffort.swift:7-18, 47-62
 *   (Opus: Low, Medium, High, Extra high, Max).
 *
 * Code vs spec: none. The crop stops after the effort section (the spec
 * allows it); the full menu is about 720pt tall.
 *
 * calibrate (P19): the NSMenu, its section headers, the checkmark column and
 * its position. The menu is drawn dropping below the chip (AppKit's default
 * for a pull-down with room below); near the bottom of the screen AppKit
 * moves it up instead. The figure is a crop: the menu is its own window and
 * runs past the crop's bottom edge.
 */

const WIDTH = 460;
const MAGNIFY = 1.1;
/** Height of the crop (app points): ends just after the Effort section; the menu runs on below it. */
const CROP_H = 508;
const ITEMS: MenuItem[] = [
  { header: "Mode" },
  { label: "Loop — auto-continues when idle" },
  { label: "Safe — redacts forbidden topics" },
  "separator",
  { header: "Model — Claude" },
  { label: "Use app default" },
  { label: "Fable" },
  { label: "Opus", icon: "checkmark" },
  { label: "Sonnet" },
  { label: "Haiku" },
  { label: "Pinned Versions", submenu: true },
  "separator",
  { header: "Effort" },
  { label: "Use app default" },
  { label: "Low" },
  { label: "Medium" },
  { label: "High", icon: "checkmark" },
  { label: "Extra high" },
  { label: "Max" },
  "separator",
  { header: "Ultracode" },
  { label: "Ultracode — multi-agent workflows on every task" },
  "separator",
  { header: "Microphone Language" },
  { label: "English", icon: "checkmark" },
  { label: "Portuguese" },
];

function ComposerModelMenu() {
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH, height: CROP_H, paddingTop: 10, overflow: "hidden" }}>
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <ChatComposer
        chip={DEMO.spotlightChat.chip}
        chipOverlay={
          <span style={{ fontWeight: 400, color: "var(--tu-text-1)" }}>
            <Menu items={ITEMS} style={{ position: "absolute", left: -2, top: "calc(100% + 6px)", zIndex: 5 }} />
          </span>
        }
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "composer-model-menu",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 24,
  label: `The chat message box with its options menu open from the model chip ${DEMO.spotlightChat.chip}. The menu lists Mode (Loop, Safe), Model — Claude (Use app default, Fable, Opus checked, Sonnet, Haiku, Pinned Versions), and Effort (Use app default, Low, Medium, High checked, Extra high, Max).`,
  caption: "The chip under the message box sets the model and effort for this thread.",
  Component: ComposerModelMenu,
};
