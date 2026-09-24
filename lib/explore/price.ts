/**
 * Marketplace price of a routine or bundle (contract §5): `{amount, currency}`
 * with `amount` in the currency's minor unit, `0` = free. Every item is free
 * until paid listings ship, so a missing price reads as free. A price that is
 * present but unusable (bad amount, unknown currency) is `null` and shows no
 * tag at all: a paid item must never be labelled "Free".
 * Pure: shared by the server fetchers, pages and tests.
 */
export type ExplorePrice = { amount: number; currency: string };

export const FREE: ExplorePrice = Object.freeze({ amount: 0, currency: "" }) as ExplorePrice;

export function normalizePrice(raw: unknown): ExplorePrice | null {
  if (raw === undefined || raw === null) return FREE;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const { amount, currency } = raw as Record<string, unknown>;
  if (amount === 0) return FREE;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0) return null;
  const code = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  if (!/^[A-Z]{3}$/.test(code) || currencyDigits(code) === null) return null;
  return { amount, currency: code };
}

/** Minor-unit digits of a currency (USD 2, JPY 0), or null when unknown. */
function currencyDigits(currency: string): number | null {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
    // Intl formats any well-formed code; only real ISO 4217 codes are listed.
    const known = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("currency").includes(currency) : true;
    return known ? (digits ?? 2) : null;
  } catch {
    return null;
  }
}

/** Free only when known to be free; an absent price (undefined) is free. */
export function isFree(price: ExplorePrice | null | undefined): boolean {
  return price === undefined || (!!price && price.amount === 0);
}

/**
 * The tag text: the localized "Free" label, the amount formatted as a
 * currency in `locale` (whole amounts drop the ".00"), or null when the price
 * cannot be shown honestly (then render no tag).
 */
export function formatPrice(price: ExplorePrice | null | undefined, locale: string, freeLabel: string): string | null {
  if (isFree(price)) return freeLabel;
  if (!price || price.amount <= 0) return null;
  const digits = currencyDigits(price.currency);
  if (digits === null) return null;
  const value = price.amount / 10 ** digits;
  const options = {
    style: "currency" as const,
    currency: price.currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
    maximumFractionDigits: digits,
  };
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return new Intl.NumberFormat("en", options).format(value);
  }
}
