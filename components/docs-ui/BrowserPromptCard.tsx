import type { ReactNode } from "react";
import styles from "./BrowserPromptCard.module.css";

/**
 * The browser panel's inline prompt cards, which share one surface: the
 * agent-browsing consent card (App Store) and the agent's per-site login
 * import approval (Direct). Same surface as browser-login-import.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/Features/InAppBrowser/Views/):
 * - AgentBrowserPrivacyViews.swift:31-90 (AgentBrowserConsentCard);
 * - BrowserSessionImportView.swift:409-545 (BrowserSessionImportApprovalCard).
 * Both: VStack spacing 8, padding 8, r16 inputBackground @0.72 + 1pt
 * threadCardBorder, `.tint(accent)`; header HStack top spacing 8 (24×24
 * icon, VStack spacing 3: title .subheadline semibold primary, wraps; copy
 * .caption secondary); controls HStack spacing 4 (`ViewThatFits`, so they
 * stack when they don't fit on one line); note .caption2 tertiary. Placed
 * between the toolbar and the tab bar with padding 8 / bottom 8
 * (InAppBrowserPanel.swift:73-113).
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
