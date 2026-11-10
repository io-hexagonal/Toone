/**
 * The order reference (`TOONE-…`) of the account's last web purchase, as this
 * browser saw it on the success page. The server only returns it from
 * `GET /billing/checkout/{session_id}`, so the account page can show it only
 * where the purchase was confirmed. It is a reference, not a credential: the
 * contract form also needs the purchase email. Both records are removed
 * when the session ends (`forgetPurchaseRecords`).
 */

import { normalizeOrderRef } from "./api";
import { CHECKOUT_KEY_PREFIX, ORDER_REF_KEY_PREFIX } from "./purchase-storage";

const KEY_PREFIX = ORDER_REF_KEY_PREFIX;

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

const SESSION_PREFIX = CHECKOUT_KEY_PREFIX;
const SESSION_ID = /^cs_[A-Za-z0-9_]{1,250}$/;

/**
 * Remember the Checkout Session of the account's last web purchase. The
 * legal invoice (Direct sales) is only on `GET /billing/checkout/{id}`, not
 * on the entitlement, so the account page reads it from this session.
 */
export function rememberCheckoutSession(userId: string, sessionId: unknown, storage: StorageLike | null = defaultStorage()): void {
  if (!userId || typeof sessionId !== "string" || !SESSION_ID.test(sessionId) || !storage) return;
  try {
    storage.setItem(SESSION_PREFIX + userId, sessionId);
  } catch {
    // full or blocked: the success page still shows the invoice line
  }
}

/** The remembered Checkout Session of this account, or null. */
export function recallCheckoutSession(userId: string, storage: StorageLike | null = defaultStorage()): string | null {
  if (!userId || !storage) return null;
  try {
    const value = storage.getItem(SESSION_PREFIX + userId);
    return value && SESSION_ID.test(value) ? value : null;
  } catch {
    return null;
  }
}
