/**
 * Browser storage keys of Toone Pro purchases, and forgetting them on sign
 * out. No imports on purpose: `clearSession()` in lib/api.ts calls
 * `forgetPurchaseRecords`.
 */

/** localStorage, per account: the order reference of the last web purchase seen in this browser. */
export const ORDER_REF_KEY_PREFIX = "toone.pro.order:";
/** localStorage, per account: the Checkout Session of that purchase (for its legal invoice line). */
export const CHECKOUT_KEY_PREFIX = "toone.pro.checkout:";

type KeyedStorage = Pick<Storage, "length" | "key" | "removeItem">;

function localStore(): KeyedStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage blocked
  }
}

/** Removes every account's remembered purchase records from this browser. */
export function forgetPurchaseRecords(store: KeyedStorage | null = localStore()): void {
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && (key.startsWith(ORDER_REF_KEY_PREFIX) || key.startsWith(CHECKOUT_KEY_PREFIX))) keys.push(key);
    }
    for (const key of keys) store.removeItem(key);
  } catch {
    // blocked: nothing was stored either
  }
}
