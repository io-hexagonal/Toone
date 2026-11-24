/**
 * Allow arms only after the page has been visible and focused for a moment
 * (security review M2, double-clickjacking): a page that swaps this one in
 * under the person's second click must not land that click on Allow. Losing
 * visibility or focus disarms it and restarts the wait, and a click whose
 * pointer went down before Allow armed is refused.
 */

/** How long the page must be visible and focused before Allow works. */
export const ATTENTION_MS = 1000;

/** What the gate reads from and listens to; the browser's in the page, fakes in tests. */
export type AttentionEnv = {
  isVisible(): boolean;
  hasFocus(): boolean;
  /** Receives focus, blur, pageshow, pagehide, pointermove, keydown and pointerdown. */
  window: EventTarget;
  /** Receives visibilitychange. */
  document: EventTarget;
  now(): number;
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

export type AttentionGate = {
  /** Whether a click on Allow counts now; `fromPointer` is false for the keyboard. */
  accepts(fromPointer: boolean): boolean;
  stop(): void;
};

export function browserAttentionEnv(): AttentionEnv {
  return {
    isVisible: () => document.visibilityState === "visible",
    hasFocus: () => document.hasFocus(),
    window,
    document,
    now: () => performance.now(),
    setTimeout: (callback, ms) => window.setTimeout(callback, ms),
    clearTimeout: (handle) => window.clearTimeout(handle as number),
  };
}

export function watchAttention(env: AttentionEnv, onArmed: (armed: boolean) => void, delay = ATTENTION_MS): AttentionGate {
  let armedAt: number | null = null;
  let timer: unknown = null;
  let lastPointerDown = -Infinity;

  const disarm = () => {
    if (timer !== null) env.clearTimeout(timer);
    timer = null;
    if (armedAt !== null) {
      armedAt = null;
      onArmed(false);
    }
  };
  const check = () => {
    if (!env.isVisible() || !env.hasFocus()) return disarm();
    if (armedAt !== null || timer !== null) return;
    timer = env.setTimeout(() => {
      timer = null;
      if (!env.isVisible() || !env.hasFocus()) return;
      armedAt = env.now();
      onArmed(true);
    }, delay);
  };
  const pointerDown = () => { lastPointerDown = env.now(); check(); };

  // Losing the page disarms at once (the focus state may lag behind the event); gaining it starts the wait.
  const lose = () => disarm();
  // Moving or typing in the page also starts the wait, in case a browser reports focus late.
  const gainEvents = ["focus", "pageshow", "pointermove", "keydown"] as const;
  const loseEvents = ["blur", "pagehide"] as const;
  for (const name of gainEvents) env.window.addEventListener(name, check);
  for (const name of loseEvents) env.window.addEventListener(name, lose);
  env.document.addEventListener("visibilitychange", check);
  env.window.addEventListener("pointerdown", pointerDown, { capture: true });
  check();

  return {
    accepts(fromPointer) {
      if (armedAt === null) return false;
      return !fromPointer || lastPointerDown >= armedAt;
    },
    stop() {
      if (timer !== null) env.clearTimeout(timer);
      for (const name of gainEvents) env.window.removeEventListener(name, check);
      for (const name of loseEvents) env.window.removeEventListener(name, lose);
      env.document.removeEventListener("visibilitychange", check);
      env.window.removeEventListener("pointerdown", pointerDown, { capture: true });
    },
  };
}
