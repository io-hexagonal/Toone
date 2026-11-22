"use client";

import { useState } from "react";
import css from "./creators.module.css";

/** One setup prompt with a copy button. */
export default function SetupPrompt({ label, text, showLabel }: { label: string; text: string; showLabel: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }
  return (
    <div className={css.prompt}>
      <div className={css.promptHead}>
        <span className={css.promptLabel}>{showLabel ? label : "Prompt"}</span>
        <button type="button" className={css.copy} aria-live="polite" onClick={() => void copy()} data-umami-event="creator-idea-copy-prompt" data-umami-event-item={label}>
          {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : "Copy prompt"}
        </button>
      </div>
      <pre className={css.promptText}>{text}</pre>
    </div>
  );
}
