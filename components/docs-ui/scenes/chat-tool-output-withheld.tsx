import { ActivityGroup, ToolCallRow } from "../ActivityGroup";
import { ChatBubble, ChatMessage, ChatMeta, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * A tool call whose output Safe Mode could not screen: the compacted tool
 * activity expanded to its one call, with the result opened. The output the
 * agent received is a withheld notice, not the file's text.
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
              result={{ output: "[Withheld: Safe Mode could not verify this output]", expanded: true }}
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
  label: `A chat in Safe Mode. You ask the agent to summarize ${DEMO.callNotes}. Its tool activity, Bash, is expanded to one call, cat ${DEMO.callNotes}, and the call's output reads [Withheld: Safe Mode could not verify this output].`,
  caption: "If screening fails, the agent gets a withheld notice, not the output.",
  Component: ChatToolOutputWithheld,
};
