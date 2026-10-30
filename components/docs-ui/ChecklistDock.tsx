import styles from "./ChecklistDock.module.css";
import { Glyph } from "./glyphs";

/**
 * P11 ChecklistDock: the live checklist docked above the message box of a
 * setup or share conversation.
 *
 * Source: APP/Features/WorkflowCatalog/ConversationalSession/ConversationChecklist.swift
 * - dock :64-97 (r14, popoverBackground (= innerBackground) @0.55 over the
 *   theme blur, 1pt white .08 strokeBorder; Divider().opacity(0.4) between parts);
 * - header :99-145 (HStack spacing 16, padding 16/8; cover 48×27 r5, or a
 *   white .06 placeholder with a `photo` glyph; headline 13 semibold primary,
 *   title 12 secondary one line; Gauge accessoryCircularCapacity scaled 0.6 in
 *   30×30 with an 8pt semibold "done/total"; `chevron.up` 12 tertiary,
 *   rotated 180° when expanded); the finished state shows a green
 *   `checkmark.seal.fill` instead of the gauge;
 * - cover chooser :147-198 ("Pick a cover" / "Cover", 16:9 tiles r7, number
 *   badge 18² black .55, chosen = 2pt accent border + checkmark);
 * - rows :200-232 (adaptive grid min 220, column gap 16, row gap 6, padding
 *   16/8, max height 180; icon column 14, HStack spacing 8 first-baseline;
 *   label 12 (done → secondary), note and detail 11 tertiary);
 * - actions :234-269 (padding 16 / bottom 8, right-aligned, UI.button 13
 *   medium, controlSize small; prominent ones `.borderedProminent` tinted accent);
 * - icons :271-281 (done checkmark.circle.fill success .85; working mini
 *   spinner; pending circle.dashed tertiary; waiting questionmark.circle.fill
 *   accent; attention exclamationmark.triangle.fill warning).
 * Fonts: Typography.Checklist (Typography.swift:141-147).
 *
 * CALIBRATE: the native Gauge (ring weight, track opacity, label size after
 * the 0.6 scale) and the small bordered / prominent buttons.
 */

export type ChecklistRowState = "done" | "working" | "pending" | "waiting" | "attention";

export type ChecklistRow = {
  label: string;
  state: ChecklistRowState;
  detail?: string;
  /** Secondary text beside the label (a site's domain). */
  note?: string;
};

export type ChecklistAction = { label: string; prominent?: boolean };

export type ChecklistCoverOption = { number: number; background: string; chosen?: boolean };

type Props = {
  headline: string;
  title: string;
  rows: ChecklistRow[];
  expanded: boolean;
  /** CSS background for the cover; omit for the app's `photo` placeholder. */
  cover?: string;
  finished?: boolean;
  actions?: ChecklistAction[];
  error?: string;
  coverOptions?: ChecklistCoverOption[];
};

function RowIcon({ state }: { state: ChecklistRowState }) {
  switch (state) {
    case "done":
      return (
        <Glyph
          color="color-mix(in srgb, var(--tu-success) 85%, transparent)"
          name="checkmark.circle.fill"
          size={13}
        />
      );
    case "working":
      return <span className={styles.spinner} />;
    case "pending":
      return <Glyph color="var(--tu-text-3)" name="circle.dashed" size={13} />;
    case "waiting":
      return <Glyph color="var(--tu-accent)" name="questionmark.circle.fill" size={13} />;
    case "attention":
      return <Glyph color="var(--tu-warning)" name="exclamationmark.triangle.fill" size={13} />;
  }
}

/** Gauge(.accessoryCircularCapacity).scaleEffect(0.6) in a 30×30 frame. CALIBRATE. */
function CapacityGauge({ done, total }: { done: number; total: number }) {
  const r = 12.4;
  const c = 2 * Math.PI * r;
  const fraction = total > 0 ? done / total : 0;
  const tint = done === total ? "var(--tu-success)" : "var(--tu-accent)";
  return (
    <span className={styles.gauge} style={{ color: tint }}>
      <svg aria-hidden="true" height={30} viewBox="0 0 30 30" width={30}>
        <circle cx={15} cy={15} fill="none" r={r} stroke="currentColor" strokeOpacity={0.3} strokeWidth={3.2} />
        <circle
          cx={15}
          cy={15}
          fill="none"
          r={r}
          stroke="currentColor"
          strokeDasharray={`${c * fraction} ${c}`}
          strokeLinecap="round"
          strokeWidth={3.2}
          transform="rotate(-90 15 15)"
        />
      </svg>
      <span className={styles.gaugeLabel}>
        {done}/{total}
      </span>
    </span>
  );
}

export function ChecklistDock({
  headline,
  title,
  rows,
  expanded,
  cover,
  finished = false,
  actions = [],
  error,
  coverOptions = [],
}: Props) {
  const done = rows.filter((row) => row.state === "done").length;
  const anyChosen = coverOptions.some((option) => option.chosen);
  return (
    <div className={styles.dock}>
      <div className={styles.header}>
        {cover ? (
          <span className={styles.cover} style={{ background: cover }} />
        ) : (
          <span className={styles.cover} data-placeholder="true">
            <Glyph color="var(--tu-text-3)" name="photo" size={12} />
          </span>
        )}
        <span className={styles.titles}>
          <span className={styles.headline}>{headline}</span>
          <span className={styles.title}>{title}</span>
        </span>
        {finished ? (
          <Glyph color="var(--tu-success)" name="checkmark.seal.fill" size={15} />
        ) : (
          <CapacityGauge done={done} total={Math.max(rows.length, 1)} />
        )}
        <Glyph
          color="var(--tu-text-3)"
          name="chevron.up"
          size={13}
          style={expanded ? { transform: "rotate(180deg)" } : undefined}
        />
      </div>

      {coverOptions.length > 0 ? (
        <>
          <div className={styles.divider} />
          <div className={styles.coverOptions}>
            <span className={styles.rowLabel}>{anyChosen ? "Cover" : "Pick a cover"}</span>
            <span className={styles.coverOptionRow}>
              {coverOptions.map((option) => (
                <span
                  className={styles.coverOption}
                  data-chosen={option.chosen ? "true" : undefined}
                  key={option.number}
                  style={{ background: option.background }}
                >
                  <span className={styles.coverNumber}>{option.number}</span>
                  {option.chosen ? (
                    <span className={styles.coverCheck}>
                      <Glyph color="var(--tu-accent)" name="checkmark.circle.fill" size={14} />
                    </span>
                  ) : null}
                </span>
              ))}
            </span>
          </div>
        </>
      ) : null}

      {expanded ? (
        <>
          <div className={styles.divider} />
          <div className={styles.rows}>
            {rows.map((row) => (
              <div className={styles.row} key={row.label}>
                <span className={styles.rowIcon}>
                  <RowIcon state={row.state} />
                </span>
                <span className={styles.rowText}>
                  <span className={styles.rowLine}>
                    <span className={styles.rowLabel} data-done={row.state === "done" ? "true" : undefined}>
                      {row.label}
                    </span>
                    {row.note ? <span className={styles.rowNote}>{row.note}</span> : null}
                  </span>
                  {row.detail ? <span className={styles.rowDetail}>{row.detail}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {actions.length > 0 || error ? (
        <div className={styles.actions}>
          {error ? <span className={styles.error}>{error}</span> : null}
          <span className={styles.spacer} />
          {actions.map((action) => (
            <span
              className={styles.action}
              data-prominent={action.prominent ? "true" : undefined}
              key={action.label}
            >
              {action.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
