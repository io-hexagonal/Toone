import type { ReactNode } from "react";
import styles from "./BrowserPromptCard.module.css";

/**
 * The browser panel's inline prompt cards, which share one surface: the
 * agent-browsing consent card (App Store) and the agent's per-site login
 * import approval (Direct). Same surface as browser-login-import.
 *
 * CALIBRATE: the small prominent / bordered / borderless buttons (native).
 */

export function BrowserPromptCard({
  icon,
  title,
  copy,
  controls,
  note,
}: {
  icon: ReactNode;
  title: string;
  copy: ReactNode;
  controls: ReactNode;
  note: string;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.copy}>
            <span className={styles.title}>{title}</span>
            <span className={styles.subtitle}>{copy}</span>
          </span>
        </div>
        <div className={styles.controls}>{controls}</div>
        <span className={styles.note}>{note}</span>
      </div>
    </div>
  );
}

/** `.buttonStyle(.borderedProminent / .bordered / .borderless)`, `.controlSize(.small)`. */
export function SmallButton({ label, kind }: { label: string; kind: "prominent" | "bordered" | "borderless" }) {
  return (
    <span className={styles.button} data-kind={kind}>
      {label}
    </span>
  );
}

/** A bold run inside the copy (Markdown `**…**` in a SwiftUI Text). */
export function PromptStrong({ children }: { children: ReactNode }) {
  return <span className={styles.strong}>{children}</span>;
}
