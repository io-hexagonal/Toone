import type { CSSProperties, ReactNode } from "react";
import styles from "./Chat.module.css";
import composerStyles from "./Composer.module.css";
import { Glyph } from "./glyphs";

/**
 * P10 Chat: transcript, message bubble, meta row and hover actions.
 * - ChatTranscript: messages stacked 8pt apart, inside 16pt padding.
 * - ChatMessage: HStack with Spacer(minLength: 60) on the far side, VStack
 *   spacing 4, aligned to the speaker's side.
 * - ChatBubble: padding 8, r12, user bubble = accent @0.15, assistant
 *   bubble = white 0.14. The text sets no font of its own: it inherits
 *   .body (13pt), not the 15pt chat size.
 * - ChatProse / ChatParagraph / ChatListItem / ChatCode: the Markdown text as
 *   one merged run: blocks joined by a blank line, consecutive list items by
 *   a single newline, bullet "•  " in secondary, inline code monospaced on
 *   white 0.10.
 * - ChatMeta: HStack spacing 8; time (Text(style: .time)) caption2 tertiary
 *   in an HStack spacing 4; the action overlay after it for the agent, before
 *   it for the user.
 * - MessageActions: HStack spacing 8 of 10pt symbols in tertiary: pencil (user, not
 *   guest), quote.bubble, doc.on.doc, arrow.triangle.branch (a borderless
 *   Menu with "Fork conversation" / "Create routine"). Opacity 0 unless the
 *   message is hovered, so hidden actions still take their space.
 *
 * - ChatComposer: the input row under the transcript (see its own comment).
 */

export type ChatSide = "user" | "agent";

export function ChatTranscript({
  children,
  padding = 16,
  style,
}: {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.transcript} style={{ padding, ...style }}>
      {children}
    </div>
  );
}

export function ChatMessage({
  side,
  children,
  meta,
}: {
  side: ChatSide;
  /** One or more ChatBubble (and cards). */
  children: ReactNode;
  /** Usually a <ChatMeta />. */
  meta?: ReactNode;
}) {
  return (
    <div className={styles.message} data-side={side}>
      <div className={styles.column}>
        {children}
        {meta}
      </div>
    </div>
  );
}

export function ChatBubble({ side, children, style }: { side: ChatSide; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.bubble} data-side={side} style={style}>
      {children}
    </div>
  );
}

export function ChatProse({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}

export function ChatParagraph({ children }: { children: ReactNode }) {
  return <div className={styles.para}>{children}</div>;
}

export function ChatListItem({ children, index }: { children: ReactNode; index?: number }) {
  return (
    <div className={styles.li}>
      <span className={styles.bullet}>{index === undefined ? "•  " : `${index}.  `}</span>
      {children}
    </div>
  );
}

/** Bold run (.body.bold()). */
export function ChatStrong({ children }: { children: ReactNode }) {
  return <span className={styles.strong}>{children}</span>;
}

export function ChatCode({ children }: { children: ReactNode }) {
  return <span className={styles.code}>{children}</span>;
}

export function ChatMeta({
  side,
  time,
  actions = "hidden",
  canEdit,
  branchMenu,
}: {
  side: ChatSide;
  /** Clock time as Text(style: .time) renders it, e.g. "10:42 AM". */
  time: string;
  /** "visible" while the message is hovered (or its branch menu is open). */
  actions?: "visible" | "hidden";
  /** User message by the owner (not a guest): shows the pencil. */
  canEdit?: boolean;
  /** A <Menu /> to draw open under the branch button. */
  branchMenu?: ReactNode;
}) {
  const overlay = (
    <MessageActions branchMenu={branchMenu} canEdit={side === "user" && canEdit} visible={actions === "visible"} />
  );
  return (
    <div className={styles.meta}>
      {side === "user" ? overlay : null}
      <span className={styles.time}>{time}</span>
      {side === "agent" ? overlay : null}
    </div>
  );
}

export function MessageActions({
  visible,
  canEdit,
  branchMenu,
}: {
  visible: boolean;
  canEdit?: boolean;
  branchMenu?: ReactNode;
}) {
  return (
    <span className={styles.actions} data-visible={visible ? "true" : "false"}>
      {canEdit ? <Glyph name="pencil" size={12} /> : null}
      <Glyph name="quote.bubble" size={12} />
      <Glyph name="doc.on.doc" size={12} />
      <span className={styles.branch}>
        <Glyph name="arrow.triangle.branch" size={12} />
        {branchMenu ? <span className={styles.branchMenu}>{branchMenu}</span> : null}
      </span>
    </span>
  );
}

/**
 * ChatComposer: the chat panel's input row in its idle state (no
 * attachments, not recording): HStack spacing 8, padding 16; [mode badge]
 * [model chip] [text field] [send / stop]. The model chip reads e.g.
 * "OPUS · HIGH", or only the chevron when everything inherits. The
 * placeholder is "Type a message..." in the default mode. Styles:
 * Composer.module.css.
 */
export function ChatComposer({
  placeholder = "Type a message...",
  text,
  chip,
  mode,
  action = "send",
  safe,
  safeOverlay,
  chipOverlay,
}: {
  placeholder?: string;
  /** Typed draft; when absent the placeholder shows and Send is disabled. */
  text?: string;
  /** Model chip label, e.g. "OPUS · HIGH"; omit for an all-inherited chip (chevron only). */
  chip?: string;
  /** Chat mode badge: PLAN (accent) or LOOP (orange). */
  mode?: "PLAN" | "LOOP";
  /** "stop" while the agent is working. */
  action?: "send" | "stop";
  /**
   * The SAFE badge (Direct edition only): green when Safe Mode is enforcing
   * (Claude provider, screening healthy), orange with a
   * warning triangle otherwise. Drawn between the mode badge and the chip.
   */
  safe?: "active" | "inactive";
  /** Drawn inside the SAFE badge's box (position: relative), e.g. its <Tooltip />. */
  safeOverlay?: ReactNode;
  /** Drawn inside the model chip's box (position: relative), e.g. its open <Menu />. */
  chipOverlay?: ReactNode;
}) {
  const canSend = Boolean(text);
  return (
    <div className={composerStyles.bar}>
      {mode ? (
        <span
          className={composerStyles.mode}
          style={{ background: mode === "LOOP" ? "var(--tu-warning)" : "var(--tu-accent)" }}
        >
          {mode}
        </span>
      ) : null}
      {safe ? (
        <span className={composerStyles.safe} data-active={safe === "active" ? "true" : "false"}>
          {safe === "active" ? null : <Glyph name="exclamationmark.triangle.fill" size={9} weight="bold" />}
          SAFE
          {safeOverlay}
        </span>
      ) : null}
      <span className={composerStyles.chip}>
        {chip ? <span>{chip}</span> : null}
        <Glyph name="chevron.down" size={8} weight="bold" />
        {chipOverlay}
      </span>
      <span className={composerStyles.field}>
        {text ? text : <span className={composerStyles.placeholder}>{placeholder}</span>}
      </span>
      {action === "stop" ? (
        <span className={composerStyles.send} data-variant="stop">
          <Glyph name="stop.fill" size={12} />
        </span>
      ) : (
        <span className={composerStyles.send} data-disabled={canSend ? undefined : "true"}>
          <Glyph name="arrow.up" size={14} weight="bold" />
        </span>
      )}
    </div>
  );
}
