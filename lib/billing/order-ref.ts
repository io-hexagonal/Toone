/**
 * The order reference (`TOONE-…`) of the account's last web purchase, as this
 * browser saw it on the success page. The server only returns it from
 * `GET /billing/checkout/{session_id}`, so the account page can show it only
 * where the purchase was confirmed. It is a reference, not a credential: the
 * contract form also needs the purchase email, and the emailed link decides.
 */

import { normalizeOrderRef } from "./api";

const KEY_PREFIX = "toone.pro.order:";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage blocked
  }
}

/** Remember the order reference for this account (a malformed one is ignored). */
export function rememberOrderRef(userId: string, ref: unknown, storage: StorageLike | null = defaultStorage()): void {
  const value = normalizeOrderRef(ref);
  if (!userId || !value || !storage) return;
  try {
    storage.setItem(KEY_PREFIX + userId, value);
  } catch {
    // full or blocked: the success page still shows it
  }
}

/** The remembered order reference of this account, or null. */
export function recallOrderRef(userId: string, storage: StorageLike | null = defaultStorage()): string | null {
  if (!userId || !storage) return null;
  try {
    return normalizeOrderRef(storage.getItem(KEY_PREFIX + userId));
  } catch {
    return null;
  }
}
