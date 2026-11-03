import type { ReactNode } from "react";
import styles from "./MultiQuestionCard.module.css";
import { Glyph } from "./glyphs";

/**
 * P13b MultiQuestionCard: the blocking question card of a chat, the one
 * Claude's AskUserQuestion and Codex's (blocking) request_user_input both
 * land in. Codex's "async" delivery uses the other card (AsyncQuestionCard in QuestionCard.tsx).
 *
 * Drawings only: <span>/<div>, no form controls.
 * CALIBRATE: `.headline` weight, the xmark.circle.fill size (default body
 * font), the overlay's blur tint over a real transcript.
 */

export type MultiQuestionOption = {
  label: string;
  description?: string;
  selected?: boolean;
  focused?: boolean;
};

export function AIOptionButton({ label, description, selected = false, focused = false }: MultiQuestionOption) {
  return (
    <div
      className={styles.option}
      data-focused={focused ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
    >
      <span className={styles.ring}>{selected ? <span className={styles.dot} /> : null}</span>
      <span className={styles.optionText}>
        <span className={styles.optionLabel}>{label}</span>
        {description ? <span className={styles.optionDescription}>{description}</span> : null}
      </span>
    </div>
  );
}

export function MultiQuestionCard({
  header,
  question,
  options,
  questionCount = 1,
  currentIndex = 0,
  canSubmit = false,
}: {
  /** The question's header, shown in the chip. */
  header: string;
  question: ReactNode;
  /** The agent's options; "Other" is appended like the app does. */
  options: MultiQuestionOption[];
  questionCount?: number;
  currentIndex?: number;
  /** Every question has an answer: "Submit All" in the accent. */
  canSubmit?: boolean;
}) {
  const last = currentIndex >= questionCount - 1;
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Glyph color="var(--tu-accent)" name="questionmark.circle.fill" size={15} />
        <span className={styles.headerTitle}>AI has some questions</span>
        <Glyph color="var(--tu-label-2)" name="xmark.circle.fill" size={15} />
      </div>

      <div className={styles.progress}>
        {Array.from({ length: questionCount }, (_, index) => (
          <span className={styles.capsule} data-on={index <= currentIndex ? "true" : undefined} key={index} />
        ))}
      </div>

      <div className={styles.question}>
        <span className={styles.chip}>{header}</span>
        <span className={styles.questionText}>{question}</span>
        <div className={styles.options}>
          {options.map((option) => (
            <AIOptionButton key={option.label} {...option} />
          ))}
          <AIOptionButton description="Enter a custom answer" label="Other" />
        </div>
      </div>

      <div className={styles.nav}>
        {currentIndex > 0 ? (
          <span className={styles.back}>
            <Glyph name="chevron.left" size={13} />
            Back
          </span>
        ) : null}
        <span className={styles.spacer} />
        <span className={styles.next} data-enabled={!last || canSubmit ? "true" : undefined} data-submit={last ? "true" : undefined}>
          {last ? "Submit All" : "Next"}
          <Glyph name={last ? "arrow.right" : "chevron.right"} size={13} />
        </span>
      </div>
    </div>
  );
}

/** The panel-wide overlay the question cards slide up in. */
export function QuestionOverlay({ children }: { children: ReactNode }) {
  return <div className={styles.overlay}>{children}</div>;
}
