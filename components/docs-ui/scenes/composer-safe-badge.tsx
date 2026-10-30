import { ChatComposer } from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { Tooltip } from "../Tooltip";

/**
 * The composer of a thread in Safe Mode: the green SAFE capsule before the
 * model chip, with its help tag showing.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/ChatPanelView.swift:2499-2575 (input row: HStack
 *   spacing 8, padding 16; [mode badge] [SAFE] [options chip] [field] [send]),
 *   :2527-2556 (SAFE: "SAFE" caption2 bold white, padding 6/3, capsule;
 *   Color.green only when the provider is Claude and the redaction hook is
 *   healthy, orange with a warning triangle otherwise; Direct edition only),
 *   :2768-2779 (safeModeBadgeHelp: "Safe mode active — tool outputs are
 *   redacted before reaching the model.").
 * - Composer: Chat.tsx <ChatComposer safe="active" />.
 *
 * Code vs spec: none.
 *
 * calibrate: the help tag (native NSToolTip). AppKit draws it under the
 * pointer and flips it above near the screen's bottom edge, where the
 * composer sits; it is drawn above the badge here. The crop starts just
 * under the composer's top divider.
 */

const WIDTH = 460;
const MAGNIFY = 1.15;

function ComposerSafeBadge() {
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH }}>
      <ChatComposer
        chip={DEMO.spotlightChat.chip}
        safe="active"
        safeOverlay={
          <Tooltip
            style={{ bottom: "calc(100% + 7px)", left: -2 }}
            text="Safe mode active — tool outputs are redacted before reaching the model."
          />
        }
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "composer-safe-badge",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 24,
  label: `The chat message box in Safe Mode. Before the model chip ${DEMO.spotlightChat.chip} sits a green SAFE badge, and its tooltip reads: Safe mode active — tool outputs are redacted before reaching the model.`,
  caption: "Green SAFE: this thread's tool output is screened before the model.",
  Component: ComposerSafeBadge,
};
