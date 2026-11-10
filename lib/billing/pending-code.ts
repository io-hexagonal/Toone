/**
 * The code a `/redeem#code=` link carried, kept for this tab while the
 * visitor signs in. A redirect sign-in reloads the page after the fragment
 * has already been removed from the address, so the code would otherwise be
 * lost. It lives in `sessionStorage` only (never in the URL or a query
 * string) and is cleared once redeemed or when the session ends.
 *
 * No imports on purpose: `clearSession()` in lib/api.ts calls `forgetPendingCode`.
 */

export const PENDING_CODE_STORAGE_KEY = "toone.redeem.pending";

/** What a code may look like here (the redeem form validates it again). */
const STORED_CODE = /^[A-Z0-9][A-Z0-9 -]{0,79}$/;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function sessionStore(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null; // storage blocked
  }
}

/** Keeps `code` for this tab. Anything that cannot be a code is not stored. */
export function rememberPendingCode(code: string, store: StorageLike | null = sessionStore()): void {
  if (!STORED_CODE.test(code)) return;
  try {
    store?.setItem(PENDING_CODE_STORAGE_KEY, code);
  } catch {
    // storage full or blocked: the code still works for this page load
  }
}

/** The code kept for this tab, or null. It stays stored until it is redeemed or the session ends. */
export function pendingCode(store: StorageLike | null = sessionStore()): string | null {
  try {
    const value = store?.getItem(PENDING_CODE_STORAGE_KEY) ?? null;
    return value !== null && STORED_CODE.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function forgetPendingCode(store: StorageLike | null = sessionStore()): void {
  try {
    store?.removeItem(PENDING_CODE_STORAGE_KEY);
  } catch {
    // nothing to forget
  }
}
