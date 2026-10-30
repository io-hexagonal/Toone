import type { ReactNode } from "react";
import styles from "./ActivityGroup.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * Tool activity in the transcript: a run of tool-only messages compacted into
 * one capsule (CompactedToolMessagesView), expandable to one row per tool
 * call (DetailedToolCallRow), whose result can expand in turn.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/RichMessageBubble.swift:1573-1584
 *   (CompactedToolMessagesView: HStack [group] Spacer(minLength: 60)).
 * - APP/Features/Chat/Views/ChatActivityGroupView.swift:3-58: VStack leading
 *   spacing 6; capsule = HStack spacing 6 [checkmark.circle.fill in the
 *   group colour, or exclamationmark.circle.fill] summary [· N failed red]
 *   [chevron.down caption2, rotated 180° when expanded]; font caption,
 *   textSecondary; padding h10, min-h 30; fill colour @0.10 (0.18 hovered);
 *   colour = toolCompleted (= success green) when done, red on failure.
 * - APP/Features/Chat/Models/ChatActivityGroup.swift:292-297 (summary: the
 *   tool's display name, "Name, +N" for several, "Actions, +N" when mixed).
 * - APP/Features/Chat/Views/RichMessageBubble.swift:1142-1300
 *   (DetailedToolCallRow): row = HStack spacing 6 [icon 10pt toolCompleted,
 *   14 wide] [title caption bold textPrimary] [input 10pt mono textTertiary,
 *   or link colour + arrow.up.right 8pt when it is a file the row opens]
 *   [chevron.up/down 8pt textTertiary when a result can expand]; padding
 *   8/4, threadCardBackground, r4. Expanded result: 11pt mono textPrimary
 *   (toolFailed on error), lineLimit 20, padding 8, full width,
 *   threadCardBackground (toolFailed @0.1 on error), r4, 0.5pt
 *   threadCardBorder, 2pt above.
 */

export function ActivityGroup({
  summary,
  failed,
  expanded = false,
  children,
}: {
  /** ChatActivityGroup.summary, e.g. "Bash" or "Read, +2". */
  summary: string;
  /** Number of failed calls (red tone, "· N failed"). */
  failed?: number;
  expanded?: boolean;
  /** <ToolCallRow />s, drawn when expanded. */
  children?: ReactNode;
}) {
  const tone = failed ? "var(--tu-error)" : "var(--tu-success)";
  return (
    <div className={styles.group}>
      <span className={styles.capsule} style={{ background: `color-mix(in srgb, ${tone} 10%, transparent)` }}>
        <Glyph
          color={tone}
          name={failed ? "exclamationmark.circle" : "checkmark.circle.fill"}
          size={12}
          style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }}
        />
        <span>{summary}</span>
        {failed ? <span style={{ color: "var(--tu-error)" }}>· {failed} failed</span> : null}
        <Glyph
          name="chevron.down"
          size={10}
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
          weight="semibold"
        />
      </span>
      {expanded ? children : null}
    </div>
  );
}

export function ToolCallRow({
  icon,
  title,
  input,
  opensFile,
  result,
}: {
  /** DetailedToolCallRow.toolIcon: Read doc.text, Bash terminal, WebFetch globe, other gear… */
  icon: GlyphName;
  /** ToolDisplayName.humanize(toolName), e.g. "Bash". */
  title: string;
  /** Shortened tool input (last 3 path components, or ≤60 chars). */
  input?: string;
  /** Read / Write / Edit with an absolute path: opens the file, never expands. */
  opensFile?: boolean;
  /** Result output; `expanded` draws it under the row. */
  result?: { output: string; expanded?: boolean; isError?: boolean };
}) {
  return (
    <div className={styles.call}>
      <span className={styles.row}>
        <span className={styles.icon}>
          <Glyph name={icon} size={11} />
        </span>
        <span className={styles.title}>{title}</span>
        {input ? (
          <span className={styles.input} data-link={opensFile ? "true" : undefined}>
            {input}
          </span>
        ) : null}
        {opensFile ? (
          <Glyph color="var(--tu-text-3)" name="arrow.up.forward" size={9} />
        ) : result ? (
          <Glyph color="var(--tu-text-3)" name={result.expanded ? "chevron.up" : "chevron.down"} size={9} />
        ) : null}
      </span>
      {result?.expanded && !opensFile ? (
        <span className={styles.result} data-error={result.isError ? "true" : undefined}>
          {result.output}
        </span>
      ) : null}
    </div>
  );
}
