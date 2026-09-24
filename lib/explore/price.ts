/**
 * Marketplace price of a routine or bundle (contract §5): `{amount, currency}`
 * with `amount` in the currency's minor unit, `0` = free. Every item is free
 * until paid listings ship, so anything missing or malformed reads as free.
 * Pure: shared by the server fetchers, pages and tests.
 */
export type ExplorePrice = { amount: number; currency: string };

export const FREE: ExplorePrice = Object.freeze({ amount: 0, currency: "" }) as ExplorePrice;

export function normalizePrice(raw: unknown): ExplorePrice {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return FREE;
  const { amount, currency } = raw as Record<string, unknown>;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0) return FREE;
  const code = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  // A paid price needs a valid ISO 4217 code; otherwise it cannot be shown honestly.
  if (!/^[A-Z]{3}$/.test(code) || !currencyDigits(code)) return FREE;
  return { amount, currency: code };
}

/** Minor-unit digits of a currency (USD 2, JPY 0), or null when unknown. */
function currencyDigits(currency: string): { digits: number } | null {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
    return { digits: digits ?? 2 };
  } catch {
    return null;
  }
}

export function isFree(price: ExplorePrice | null | undefined): boolean {
  return !price || price.amount <= 0;
}

/**
 * The tag text: the localized "Free" label, or the amount formatted as a
 * currency in `locale` (whole amounts drop the ".00").
 */
export function formatPrice(price: ExplorePrice | null | undefined, locale: string, freeLabel: string): string {
  if (!price || isFree(price)) return freeLabel;
  const known = currencyDigits(price.currency);
  if (!known) return freeLabel;
  const value = price.amount / 10 ** known.digits;
  const whole = Number.isInteger(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: price.currency,
      minimumFractionDigits: whole ? 0 : known.digits,
      maximumFractionDigits: known.digits,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en", { style: "currency", currency: price.currency }).format(value);
  }
}
