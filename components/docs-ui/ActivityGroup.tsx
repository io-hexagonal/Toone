import type { ReactNode } from "react";
import styles from "./ActivityGroup.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * Tool activity in the transcript: a run of tool-only messages compacted into
 * one capsule, expandable to one row per tool call, whose result can expand
 * in turn.
 */

export function ActivityGroup({
  summary,
  failed,
  expanded = false,
  children,
}: {
  /** The group's summary, e.g. "Bash" or "Read, +2". */
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
  /** Tool icon: Read doc.text, Bash terminal, WebFetch globe, other gear… */
  icon: GlyphName;
  /** The tool's display name, e.g. "Bash". */
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
