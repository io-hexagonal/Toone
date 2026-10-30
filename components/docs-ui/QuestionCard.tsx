import type { CSSProperties } from "react";
import styles from "./QuestionCard.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P13 QuestionCard: the "ask the user" surfaces of a chat.
 * Sources (main repo, desktop app, Features/Chat/Views/):
 * - QuestionSharedComponents.swift: QuestionHeaderChip :14-34 (accent
 *   capsule: symbol + caption bold, padding 10/4, accent @0.1),
 *   QuestionOptionRow :36-104 (padding 12, HStack top spacing 12; 18pt
 *   radio/checkbox mark, 1.5 stroke; label subheadline, semibold when
 *   selected; optional caption description; selected = accent @0.1 fill +
 *   accent stroke, else secondary @0.3 stroke; r8), QuestionAnswerFieldStyle
 *   :106-124 (padding 12, inputBackground, r8, accent stroke while focused
 *   or filled, else secondary @0.3);
 * - AsyncQuestionComposer.swift:29-205: the non-blocking card above the
 *   composer. Full-width band on threadCardBackground (no radius); header
 *   min-h 48, padding leading 16 / trailing 8, chip "Question for you" (+
 *   "1 of N" caption secondary only when more than one is pending), then the
 *   minimize (`minus`) and close (`xmark`) controls: 14pt medium glyph in a
 *   32×32 frame, 8 padding, accent; body padding 0/16/16, VStack 10:
 *   question (subheadline) + options (VStack 8), the "Write an answer" field
 *   (2–6 lines), and the footer "Work continues while you answer." (caption
 *   secondary) + "Send answer →" (.borderedProminent tinted accent, label
 *   semibold), disabled until an option is chosen or text is typed.
 *
 * Drawings only: <span>/<div>, no form controls.
 *
 * CALIBRATE: the borderedProminent button (native), the TextField's
 * placeholder colour and the radio mark's exact stroke.
 */

/** Accent capsule that names the question. */
export function QuestionHeaderChip({
  title,
  symbol = "questionmark.circle.fill",
}: {
  title: string;
  symbol?: GlyphName;
}) {
  return (
    <span className={styles.chip}>
      <Glyph name={symbol} size={12} />
      <span>{title}</span>
    </span>
  );
}

export function QuestionOptionRow({
  label,
  description,
  selected = false,
  multiSelect = false,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  multiSelect?: boolean;
}) {
  return (
    <div className={styles.option} data-selected={selected ? "true" : undefined}>
      <span className={styles.mark} data-multi={multiSelect ? "true" : undefined}>
        {selected ? (
          multiSelect ? (
            <Glyph name="checkmark" size={11} weight="bold" />
          ) : (
            <span className={styles.markDot} />
          )
        ) : null}
      </span>
      <span className={styles.optionText}>
        <span className={styles.optionLabel}>{label}</span>
        {description ? <span className={styles.optionDescription}>{description}</span> : null}
      </span>
    </div>
  );
}

export function QuestionAnswerField({
  placeholder = "Write an answer",
  value,
  emphasized = false,
  lines = 2,
}: {
  placeholder?: string;
  value?: string;
  /** Focused or filled: accent stroke. */
  emphasized?: boolean;
  /** Visible line count (the async card's field reserves 2, up to 6). */
  lines?: number;
}) {
  return (
    <div
      className={styles.field}
      data-emphasized={emphasized ? "true" : undefined}
      style={{ "--tu-q-lines": lines } as CSSProperties}
    >
      {value ? <span>{value}</span> : <span className={styles.placeholder}>{placeholder}</span>}
    </div>
  );
}

/** The async (non-blocking) question card, AsyncQuestionComposer. */
export function AsyncQuestionCard({
  question,
  options,
  selected,
  answer,
  pendingCount = 1,
  focused = true,
}: {
  question: string;
  options: string[];
  /** Index of the chosen option (with an empty field). */
  selected?: number;
  /** Typed answer (clears the option highlight, like the app). */
  answer?: string;
  pendingCount?: number;
  /** The field takes focus when the card appears. */
  focused?: boolean;
}) {
  const hasAnswer = Boolean(answer) || selected !== undefined;
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>
          <QuestionHeaderChip title="Question for you" />
          {pendingCount > 1 ? <span className={styles.count}>1 of {pendingCount}</span> : null}
        </span>
        <span className={styles.control}>
          <Glyph name="minus" size={16} weight="medium" />
        </span>
        <span className={styles.control}>
          <Glyph name="xmark" size={16} weight="medium" />
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.content}>
          <div className={styles.question}>{question}</div>
          {options.map((option, index) => (
            <QuestionOptionRow key={option} label={option} selected={!answer && selected === index} />
          ))}
        </div>
        <QuestionAnswerField emphasized={focused || Boolean(answer)} value={answer} />
        <div className={styles.footer}>
          <span className={styles.footnote}>Work continues while you answer.</span>
          <span className={styles.send} data-disabled={hasAnswer ? undefined : "true"}>
            Send answer
            <Glyph name="arrow.right" size={14} weight="semibold" />
          </span>
        </div>
      </div>
    </div>
  );
}
