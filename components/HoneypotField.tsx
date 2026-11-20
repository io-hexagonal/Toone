import { useId } from "react";
import { HONEYPOT_FIELD } from "@/lib/contact-guard";

/**
 * The spam honeypot for forms that post to `/api/contact`
 * (lib/contact-guard.ts): an ordinary-looking text input, moved off screen
 * rather than `display: none` (which many bots skip), hidden from assistive
 * technology and out of the tab order. People leave it empty; the route drops
 * any submission that fills it.
 */
export default function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
    >
      <label htmlFor={id}>Website</label>
      <input
        id={id}
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
