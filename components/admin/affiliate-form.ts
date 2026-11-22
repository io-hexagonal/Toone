import {
  COMMISSION_MAX,
  DISCOUNT_MAX,
  DISCOUNT_MIN,
  MONTHS_MAX,
  slugProblem,
  type AffiliateDiscountDuration,
  type AffiliateDiscountScope,
  type CreateAffiliateInput,
} from "@/lib/affiliates";

export type AffiliateFormState = {
  name: string;
  slug: string;
  slugEdited: boolean;
  source: "new" | "existing";
  percent: number;
  duration: AffiliateDiscountDuration;
  months: number;
  scope: AffiliateDiscountScope;
  existingCode: string;
  commission: number;
  email: string;
};

export const EMPTY_AFFILIATE_FORM: AffiliateFormState = {
  // House default (owner, 2026-11-22): Lifetime at about $49 (75% off $199.99) and a 25% share; creators get 20-30%.
  name: "", slug: "", slugEdited: false, source: "new", percent: 75, duration: "once", months: 3, scope: "lifetime",
  existingCode: "", commission: 25, email: "",
};

/** The admin input for the form, or the first problem with it. */
export function affiliateRequestFrom(form: AffiliateFormState): { ok: true; input: CreateAffiliateInput } | { ok: false; error: string; field: string } {
  const name = form.name.trim();
  if (!name) return { ok: false, error: "Enter the creator's name.", field: "affiliate-name" };
  const slug = form.slug.trim().toLowerCase();
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: `Vanity link: ${problem}`, field: "affiliate-slug" };
  if (!Number.isInteger(form.commission) || form.commission < 0 || form.commission > COMMISSION_MAX) {
    return { ok: false, error: `Revenue share: 0 to ${COMMISSION_MAX} percent.`, field: "affiliate-commission" };
  }
  const input: CreateAffiliateInput = { name, slug, commission_percent: form.commission };
  if (form.source === "existing") {
    const code = form.existingCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,40}$/.test(code)) return { ok: false, error: "Stripe promotion code: 3 to 40 letters and digits.", field: "affiliate-existing" };
    input.existing_promotion_code = code;
    return { ok: true, input };
  }
  if (!Number.isInteger(form.percent) || form.percent < DISCOUNT_MIN || form.percent > DISCOUNT_MAX) {
    return { ok: false, error: `Discount: ${DISCOUNT_MIN} to ${DISCOUNT_MAX} percent.`, field: "affiliate-percent" };
  }
  // Checkout applies creator codes to the Lifetime plan only, which is one payment.
  input.discount = { percent: form.percent, duration: "once", months: null, scope: "lifetime" };
  return { ok: true, input };
}

