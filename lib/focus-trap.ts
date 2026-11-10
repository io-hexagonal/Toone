/** Elements a keyboard user can Tab to inside a dialog. */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Where Tab should move inside a modal dialog, or null to let the browser
 * move focus itself. `controls` are the dialog's focusable elements in
 * order. Focus wraps from the last to the first (and back with Shift), and
 * focus found outside the dialog is pulled back in.
 */
export function trappedFocusTarget<T>(controls: readonly T[], active: T | null, shiftKey: boolean): T | null {
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (first === undefined || last === undefined) return null;
  const inside = active !== null && controls.includes(active);
  if (shiftKey) return !inside || active === first ? last : null;
  return !inside || active === last ? first : null;
}

/**
 * Keeps Tab inside `container` while it is open and returns a cleanup that
 * stops trapping and gives focus back to whatever had it before.
 */
export function trapFocus(container: HTMLElement): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const controls = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((element) => element.getClientRects().length > 0);
    const target = trappedFocusTarget(controls, document.activeElement as HTMLElement | null, event.shiftKey);
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("keydown", onKey);
    if (previous?.isConnected) previous.focus({ preventScroll: true });
  };
}
