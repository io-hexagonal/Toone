import type { CSSProperties, ReactNode } from "react";
import styles from "./Chat.module.css";
import { Glyph } from "./glyphs";

/**
 * P10 Chat: transcript, message bubble, meta row and hover actions.
 * Sources (desktop app, main repo):
 * - ChatTranscript: CPV messageList VStack(spacing: Spacing.sm) inside the
 *   ScrollView's .padding(Spacing.md) (ChatPanelView.swift:1502-1512, 1584-1586).
 * - ChatMessage: RichMessageBubble.bubble (RichMessageBubble.swift:90-187):
 *   HStack with Spacer(minLength: 60) on the far side, VStack spacing 4
 *   (Spacing.xs), aligned to the speaker's side.
 * - ChatBubble: TranscriptTextMessageSurface (TranscriptMessagePresentation.swift:62-87):
 *   padding 8, r12, userBubble = accent @0.15, assistantBubble = white 0.14.
 *   Text is MarkdownTextView, which sets no font: it inherits .body (13pt),
 *   not Typography.Chat.message (15pt, unused by the transcript).
 * - ChatProse / ChatParagraph / ChatListItem / ChatCode: MarkdownTextView's
 *   merged run (MarkdownTextView.swift:246-318): blocks joined by a blank
 *   line, consecutive list items by a single newline, bullet "•  " in
 *   textSecondary, inline code monospaced on white 0.10.
 * - ChatMeta: metadataView (RichMessageBubble.swift:428-452): HStack spacing 8;
 *   time (Text(style: .time)) caption2 textTertiary in an HStack spacing 4;
 *   the action overlay after it for the agent, before it for the user.
 * - MessageActions: messageActionOverlay (RichMessageBubble.swift:205-263):
 *   HStack spacing 8 of 10pt symbols in textTertiary: pencil (user, not
 *   guest), quote.bubble, doc.on.doc, arrow.triangle.branch (a borderless
 *   Menu with "Fork conversation" / "Create routine"). Opacity 0 unless the
 *   message is hovered, so hidden actions still take their space.
 *
 * The Composer (ChatInputView.swift) is not drawn yet.
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

/** Bold run (.body.bold()): MarkdownTextView.swift:753-765. */
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
