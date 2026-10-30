import type { CSSProperties, ReactNode } from "react";
import styles from "./NativeControls.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * Native AppKit controls drawn as pictures (P17 / P19 pieces): checkbox,
 * radio group, pop-up button and push buttons, dark appearance, tinted with
 * the theme accent the way `.liveTheme()` tints them
 * (APP/UI/Theme/LiveTheme.swift:27-36: `.tint(style.accent)`).
 *
 * CALIBRATE: none of these have geometry in the repo (plan §5.2). Sizes,
 * fills, radii and the label gaps are close guesses for macOS 26 and must be
 * replaced from captures of the running app.
 *
 * Everything renders <span>s: figures are images, never controls.
 */

/** `Toggle(...)` in its macOS default (checkbox) style. */
export function Checkbox({ checked, children, style }: { checked: boolean; children?: ReactNode; style?: CSSProperties }) {
  return (
    <span className={styles.choice} style={style}>
      <span className={styles.checkbox} data-on={checked ? "true" : undefined}>
        {checked ? <Glyph color="#fff" name="checkmark" size={11} weight="bold" /> : null}
      </span>
      {children !== undefined ? <span className={styles.choiceLabel}>{children}</span> : null}
    </span>
  );
}

/** One radio button and its title. */
export function Radio({ selected, children }: { selected: boolean; children: ReactNode }) {
  return (
    <span className={styles.choice}>
      <span className={styles.radio} data-on={selected ? "true" : undefined} />
      <span className={styles.choiceLabel}>{children}</span>
    </span>
  );
}

/**
 * `Picker(label, …).pickerStyle(.radioGroup)`. Outside a Form, SwiftUI on
 * macOS shows the picker's label to the left of the stacked radio buttons,
 * on the first button's line.
 */
export function RadioGroup({ label, options, selected }: { label?: string; options: string[]; selected: number }) {
  return (
    <span className={styles.radioPicker}>
      {label ? <span className={styles.pickerLabel}>{label}</span> : null}
      <span className={styles.radioColumn}>
        {options.map((option, index) => (
          <Radio key={option} selected={index === selected}>
            {option}
          </Radio>
        ))}
      </span>
    </span>
  );
}

/** `Picker(label, …)` in the default (menu / pop-up button) style. */
export function PopUpButton({
  label,
  value,
  maxWidth,
  style,
}: {
  label?: string;
  value: string;
  /** `.frame(maxWidth:)` on the picker: label + button share this width. */
  maxWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <span className={styles.popUpPicker} style={{ maxWidth, ...style }}>
      {label ? <span className={styles.pickerLabel}>{label}</span> : null}
      <span className={styles.popUp}>
        <span className={styles.popUpValue}>{value}</span>
        <Glyph name="chevron.up.chevron.down" size={11} weight="semibold" />
      </span>
    </span>
  );
}

/**
 * A push button. `prominent` = `.buttonStyle(.borderedProminent)` tinted with
 * the theme accent (Smoky Quartz's 0.72 grey gets a white label from AppKit,
 * LayoutStyle.swift:342-348). `small` = `.controlSize(.small)`.
 */
export function PushButton({
  label,
  icon,
  prominent = false,
  small = false,
  fontSize,
  fontWeight,
  style,
}: {
  label: string;
  icon?: GlyphName;
  prominent?: boolean;
  small?: boolean;
  /** Override the control font (e.g. Typography.UI.button = 13 medium). */
  fontSize?: number;
  fontWeight?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className={styles.push}
      data-prominent={prominent ? "true" : undefined}
      data-small={small ? "true" : undefined}
      style={{ fontSize, fontWeight, ...style }}
    >
      {icon ? <Glyph name={icon} size={small ? 12 : 13} weight="medium" /> : null}
      {label}
    </span>
  );
}
