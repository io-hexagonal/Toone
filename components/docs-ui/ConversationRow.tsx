import type { ReactNode } from "react";
import styles from "./ConversationRow.module.css";
import { DestinationHeader } from "./DestinationHeader";
import { Field } from "./Field";
import { Glyph } from "./glyphs";
import { NativeSegmented } from "./NativeSegmented";

/**
 * The Conversations destination of the left panel and its rows.
 *
 * The native segmented control is NativeSegmented (calibrate).
 */

export type ConversationDot = "seen" | "processing" | "unseen" | "attention";

export type ConversationSpec = {
  title: string;
  /** Formatted like `.relative(presentation: .named)`: "2 minutes ago", "yesterday". */
  time: string;
  agent: string;
  department: string;
  author?: string;
  preview?: string;
  pinned?: boolean;
  dot?: ConversationDot;
  selected?: boolean;
};

export function ConversationRow({ thread }: { thread: ConversationSpec }) {
  return (
    <div className={styles.row} data-selected={thread.selected ? "true" : undefined}>
      <span className={styles.dot} data-dot={thread.dot ?? "seen"} />
      <div className={styles.lines}>
        <div className={styles.titleLine}>
          {thread.pinned ? (
            <span className={styles.pin}>
              <Glyph name="pin.fill" size={9} weight="semibold" />
            </span>
          ) : null}
          <span className={styles.title}>{thread.title}</span>
          <span className={styles.time}>{thread.time}</span>
        </div>
        <span className={styles.meta}>
          {thread.agent} · {thread.department}
        </span>
        {thread.preview ? (
          <div className={styles.previewLine}>
            {thread.author ? <span className={styles.author}>{thread.author}:</span> : null}
            <span className={styles.preview}>{thread.preview}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConversationSection({ title }: { title: string }) {
  return <div className={styles.section}>{title}</div>;
}

export function ConversationsDestination({ children }: { children: ReactNode }) {
  return (
    <div>
      <DestinationHeader title="Conversations" />
      <div className={styles.search}>
        <Field placeholder="Search conversations" />
      </div>
      <div className={styles.scope}>
        <NativeSegmented fill segments={["Active", "Archived"]} selected={0} />
      </div>
      <div className={styles.list}>{children}</div>
    </div>
  );
}
