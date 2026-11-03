import { ChatComposer } from "../Chat";
import { DEMO } from "../demo";
import { Menu, type MenuItem } from "../Menu";
import type { SceneDefinition } from "../scene";

/**
 * The composer's options menu, open from the model chip, in a Claude thread
 * set to Opus with High effort (chip "OPUS · HIGH"). Cropped after the
 * effort section; Ultracode and Microphone Language follow below it.
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
const CROP_H = 460;
const ITEMS: MenuItem[] = [
  { header: "Mode" },
  { label: "Safe — redacts forbidden topics" },
  "separator",
  { header: "Model — Claude" },
  { label: "Use app default" },
  { label: "Fable" },
  { label: "Opus", icon: "checkmark" },
  { label: "Sonnet" },
  { label: "Haiku" },
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
  label: `The chat message box with its options menu open from the model chip ${DEMO.spotlightChat.chip}. The menu lists Mode (Safe), Model — Claude (Use app default, Fable, Opus checked, Sonnet, Haiku), and Effort (Use app default, Low, Medium, High checked, Extra high, Max).`,
  caption: "The chip under the message box sets the model and effort for this thread.",
  Component: ComposerModelMenu,
};
