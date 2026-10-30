import { ActivityGroup, ToolCallRow } from "../ActivityGroup";
import { ChatBubble, ChatMessage, ChatMeta, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * A tool call whose output Safe Mode could not screen: the compacted tool
 * activity expanded to its one call, with the result opened. The output the
 * agent received is the fail-closed marker, not the file's text.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - ActivityGroup.tsx (ChatActivityGroupView.swift:3-58,
 *   ChatActivityGroup.swift:292-297, DetailedToolCallRow
 *   RichMessageBubble.swift:1142-1300).
 * - APP/Core/Services/AIService/SafeMode/SafeModeService.swift:362
 *   (FAIL_CLOSED = "[REDACTED: safe mode could not verify this output]"),
 *   :485-491 (a failed screen replaces the output and logs withheld_error),
 *   :750-770 (withheldReplacement: every string in the tool response becomes
 *   the marker). The call itself succeeded, so the group stays green.
 * - APP/Core/Services/AIService/Models/AIMessage.swift:541-570 (Bash input
 *   summary = the command).
 *
 * Code vs spec:
 * - The spec draws a Read row "Read notes/pricing-call.md" with its result
 *   expanded. A Read / Write / Edit row with a path opens the file viewer
 *   and never expands its result (DetailedToolCallRow isClickable,
 *   :1174-1177, :1205-1225). The figure uses the same file read through
 *   Bash ("cat notes/pricing-call.md"), whose result does expand.
 * - The capsule reads the tool's display name ("Bash"), not
 *   "Read file · 1 action": the summary is the name, "+N" only for several.
 */

const WIDTH = 440;
const MAGNIFY = 1.15;

function ChatToolOutputWithheld() {
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH }}>
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="user" time="2:14 PM" />} side="user">
          <ChatBubble side="user">Summarize the call notes in {DEMO.callNotes}.</ChatBubble>
        </ChatMessage>
        <div style={{ paddingRight: 60 }}>
          <ActivityGroup expanded summary="Bash">
            <ToolCallRow
              icon="terminal"
              input={`cat ${DEMO.callNotes}`}
              result={{ output: "[REDACTED: safe mode could not verify this output]", expanded: true }}
              title="Bash"
            />
          </ActivityGroup>
        </div>
      </ChatTranscript>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "chat-tool-output-withheld",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 16,
  label: `A chat in Safe Mode. You ask the agent to summarize ${DEMO.callNotes}. Its tool activity, Bash, is expanded to one call, cat ${DEMO.callNotes}, and the call's output reads [REDACTED: safe mode could not verify this output].`,
  caption: "If screening fails, the agent gets a redaction marker, not the output.",
  Component: ChatToolOutputWithheld,
};
