import type { CSSProperties, ReactNode } from "react";
import styles from "./SettingsForm.module.css";
import { Glyph, type GlyphName } from "./glyphs";
import { PopUpButton, Radio } from "./NativeControls";

/**
 * P17 SettingsForm: the Settings panel (a NavigationSplitView) with its
 * destination sidebar and a native grouped Form in the detail column.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:10-87 (destinations, labels,
 *   icons, order); :127-190 (sidebar rows: VStack spacing 3, padding 10;
 *   Label .body, semibold when selected; padding h10, minHeight 27, r7;
 *   selected accent .18 fill + accent .28 1pt stroke, accent text; column
 *   background innerBackgroundColor .46, width min 170 / ideal 190);
 *   :183-188 (detail background innerBackgroundColor .18); :205-222 (close
 *   button overlay); :251-273 (visibleDestinations); :106-121
 *   (themedSettingsForm: hidden scroll background + `.tint(accent)`, which is
 *   why switches and radios are Smoky Quartz grey, never system blue).
 *
 * CALIBRATE: the grouped Form (section box, header/footer insets, row height,
 * separators) and the switch / text field are native AppKit drawing with no
 * geometry in the repo (plan §5.2). The macOS 26 NavigationSplitView may also
 * inset its sidebar as a glass pane; this draws a flat column.
 *
 * Window width: the real panel is at least 940pt wide (SettingsView.swift:189-196).
 * Figures are ≤640, so scenes draw the window narrower and long footers wrap
 * onto more lines than in the app.
 */

export type SettingsDestinationId =
  | "general"
  | "account"
  | "permissions"
  | "aiProvider"
  | "mode"
  | "git"
  | "layout"
  | "routines"
  | "calendar"
  | "meetings"
  | "hotkey"
  | "zenMode"
  | "browser"
  | "mobile"
  | "mcps"
  | "business"
  | "accessCenter"
  | "about";

/**
 * The sidebar as the Direct (website) edition shows it to a regular user:
 * Toone Pro is Store-only, Developer needs Developer Mode, Silk Review needs
 * the reviewer capability (SettingsView.swift:251-273, TooneProPolicy:55).
 * Icons map to the kit's lookalikes ("gear" → gearshape).
 */
export const SETTINGS_DESTINATIONS: { id: SettingsDestinationId; label: string; icon: GlyphName }[] = [
  { id: "general", label: "General", icon: "gearshape" },
  { id: "account", label: "Account", icon: "person.crop.circle" },
  { id: "permissions", label: "Permissions", icon: "hand.raised" },
  { id: "aiProvider", label: "AI Provider", icon: "cpu" },
  { id: "mode", label: "Mode", icon: "person.badge.shield.checkmark" },
  { id: "git", label: "Project History", icon: "arrow.triangle.branch" },
  { id: "layout", label: "Layout", icon: "rectangle.split.2x1" },
  { id: "routines", label: "Routines", icon: "arrow.triangle.2.circlepath" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "meetings", label: "Meetings", icon: "mic.badge.plus" },
  { id: "hotkey", label: "Hotkey", icon: "keyboard" },
  { id: "zenMode", label: "Zen Mode", icon: "sparkles.tv" },
  { id: "browser", label: "Browser", icon: "globe" },
  { id: "mobile", label: "Mobile", icon: "iphone" },
  { id: "mcps", label: "MCPs", icon: "puzzlepiece.extension" },
  { id: "business", label: "Business", icon: "building.2" },
  { id: "accessCenter", label: "Access Center", icon: "person.badge.key" },
  { id: "about", label: "About", icon: "info.circle" },
];

/* ---- window ---------------------------------------------------------------- */

type WindowProps = {
  selected: SettingsDestinationId;
  /** Sidebar column width; 170 is its minimum, 190 its ideal. */
  sidebarWidth?: number;
  /** Top inset of the form: 20 at the top of a page, smaller for a scrolled crop. */
  formPaddingTop?: number;
  /** Show the close (✕) overlay; true when the crop includes the window's top edge. */
  showClose?: boolean;
  /** Crop height floor, e.g. to keep the selected sidebar row inside the frame. */
  minHeight?: number;
  /**
   * The sidebar list scrolled up by this many px: the crop is a band of a
   * window shorter than the 18-row list, so the selected row stays in view
   * while the detail column shows another part of its page.
   */
  sidebarOffset?: number;
  children: ReactNode;
};

export function SettingsWindow({
  selected,
  sidebarWidth = 170,
  formPaddingTop,
  showClose = true,
  minHeight,
  sidebarOffset,
  children,
}: WindowProps) {
  return (
    <div className={styles.window} style={minHeight ? { minHeight } : undefined}>
      <div className={styles.sidebar} style={{ width: sidebarWidth }}>
        <div className={styles.sidebarList} style={sidebarOffset ? { top: -sidebarOffset } : undefined}>
          {SETTINGS_DESTINATIONS.map((d) => (
            <span className={styles.sidebarRow} data-selected={d.id === selected ? "true" : undefined} key={d.id}>
              <span className={styles.sidebarIcon}>
                <Glyph name={d.icon} size={15} weight={d.id === selected ? "semibold" : "regular"} />
              </span>
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.detail}>
        <div className={styles.form} style={formPaddingTop === undefined ? undefined : { paddingTop: formPaddingTop }}>
          {children}
        </div>
      </div>
      {showClose ? (
        <span className={styles.close}>
          <Glyph name="xmark" size={11} weight="bold" />
        </span>
      ) : null}
    </div>
  );
}

/* ---- section ------------------------------------------------------------- */

type SectionProps = {
  header?: ReactNode;
  /** Footer text; an array renders one paragraph per entry (VStack spacing 4). */
  footer?: ReactNode | ReactNode[];
  /** The crop cuts through the top / bottom of this section's box. */
  cutTop?: boolean;
  cutBottom?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};

export function SettingsSection({ header, footer, cutTop, cutBottom, children, style }: SectionProps) {
  const paragraphs = Array.isArray(footer) ? footer : footer === undefined ? [] : [footer];
  return (
    <div className={styles.section} style={style}>
      {header !== undefined ? <div className={styles.sectionHeader}>{header}</div> : null}
      <div
        className={styles.box}
        data-cut-bottom={cutBottom ? "true" : undefined}
        data-cut-top={cutTop ? "true" : undefined}
      >
        {children}
      </div>
      {paragraphs.length ? (
        <div className={styles.footer}>
          {paragraphs.map((p, i) => (
            <div className={styles.footerLine} key={i}>
              {p}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---- rows ------------------------------------------------------------------ */

type RowProps = {
  /** Leading label (Toggle / Picker title). Omit for a free-form row. */
  label?: ReactNode;
  /** Trailing control(s); with no label, the row's whole content. */
  children?: ReactNode;
  align?: "center" | "top";
  style?: CSSProperties;
};

/** One Form row: `label … control`, or free content when `label` is omitted. */
export function SettingsRow({ label, children, align = "center", style }: RowProps) {
  return (
    <div className={styles.row} data-align={align === "top" ? "top" : undefined} style={style}>
      {label !== undefined ? (
        <>
          <span className={styles.rowLabel}>{label}</span>
          {children !== undefined ? <span className={styles.rowTrailing}>{children}</span> : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

/** A caption subheading row inside a section (`.caption.weight(.medium)`, tertiary). */
export function SettingsSubheading({ children }: { children: ReactNode }) {
  return (
    <div className={styles.row} style={{ minHeight: 0, paddingTop: 7, paddingBottom: 5 }}>
      <span className={styles.subheading}>{children}</span>
    </div>
  );
}

/* ---- controls -------------------------------------------------------------- */

/** `Toggle` in switch style (a Form's default on macOS), tinted with the accent. */
export function Switch({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <span
      className={styles.switch}
      data-disabled={disabled ? "true" : undefined}
      data-on={on ? "true" : undefined}
    />
  );
}

/** `Picker(label, …).pickerStyle(.radioGroup)` as a Form row's content. */
export function FormRadioPicker({
  label,
  options,
  selected,
}: {
  label: ReactNode;
  /** Option title, optionally with a trailing accessory (an HStack in the option). */
  options: { label: ReactNode; trailing?: ReactNode }[];
  selected: number;
}) {
  return (
    <div className={styles.radioPicker}>
      <span>{label}</span>
      <span className={styles.radioColumn}>
        {options.map((option, index) => (
          <span className={styles.radioOption} key={index}>
            <Radio selected={index === selected}>{option.label}</Radio>
            {option.trailing}
          </span>
        ))}
      </span>
    </div>
  );
}

/** A menu Picker's pop-up button, hugging its title on a Form row's trailing side. */
export function FormPopUp({ value }: { value: string }) {
  return (
    <span className={styles.popUpHug}>
      <PopUpButton value={value} />
    </span>
  );
}

/** `TextField(…).textFieldStyle(.roundedBorder)`: placeholder or typed value. */
export function FormTextField({ placeholder, value }: { placeholder?: string; value?: string }) {
  return (
    <span className={styles.textField}>
      <span className={value ? undefined : styles.textFieldPlaceholder}>{value || placeholder}</span>
    </span>
  );
}
