"use client";

import { useEffect, useRef, useState } from "react";
import { createOpenAttempt } from "@/lib/explore/presentation";
import { TOONE_PRO_SUCCESS_URL } from "./CheckoutReturn.helpers";

/** Sentinel the open attempt "navigates" to when the app did not take over. */
const NO_FALLBACK = "about:blank#toone-not-opened";

/**
 * "Return to Toone": opens `toone://pro/success`, which only asks the Direct
 * app to refresh its plan, so it needs no web session. If the app does not
 * take over, the hint replaces the note; the page never leaves on its own.
 */
export default function ReturnToToone({ label, note, hint, buttonClassName, noteClassName }: {
  label: string;
  note: string;
  hint: string;
  buttonClassName: string;
  noteClassName: string;
}) {
  const [notOpened, setNotOpened] = useState(false);
  const cancelOpen = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelOpen.current?.(), []);

  function openToone() {
    setNotOpened(false);
    cancelOpen.current?.();
    cancelOpen.current = createOpenAttempt(
      {
        listen: (name, fn) => {
          const target = name === "visibilitychange" ? document : window;
          target.addEventListener(name, fn);
          return () => target.removeEventListener(name, fn);
        },
        later: (fn, ms) => {
          const timer = window.setTimeout(fn, ms);
          return () => window.clearTimeout(timer);
        },
        visible: () => document.visibilityState === "visible",
        navigate: destination => {
          if (destination === TOONE_PRO_SUCCESS_URL) window.location.assign(destination);
          else setNotOpened(true);
        },
      },
      TOONE_PRO_SUCCESS_URL,
      NO_FALLBACK,
    );
  }

  return (
    <>
      <button type="button" className={buttonClassName} onClick={openToone} data-umami-event="pro-return-to-app">
        {label}
      </button>
      <p className={noteClassName}>{notOpened ? hint : note}</p>
    </>
  );
}
