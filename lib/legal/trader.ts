/**
 * Trader identity published on /en/legal-notice and referenced by the Terms
 * and the Privacy Policy. The owner fills in every TODO_OWNER value before
 * release; it must match the EU trader details on the App Store listing.
 *
 * Until every value is filled in, `TRADER_DETAILS_COMPLETE` is false and the
 * site hides the Legal notice: the page is a 404, it is left out of the
 * sitemap and the footer, and the Terms and the Privacy Policy point to the
 * contact email instead of linking to it.
 *
 * Release gate: a production build (`VERCEL_ENV=production`, or
 * `LEGAL_RELEASE_CHECK=1`) never offers web checkout while any value still
 * starts with TODO_OWNER (lib/legal/release.ts), and the prebuild step fails
 * that build outright if the API already has web checkout on
 * (scripts/legal/release-check.ts). tests/legal/release-owner-data.test.ts
 * fails too, when run with either variable.
 *
 * The identity, address, tax number and email are the trader's registered
 * details; the remaining TODO_OWNER values (telephone, CAE, Livro de
 * Reclamações link, ADR entity) must still come from the owner.
 */
export const TODO_OWNER = "TODO_OWNER";

export type TraderField = {
  label: string;
  value: string;
  /** Rendered as a link when set (mailto:, tel: or https:). */
  href?: string;
};

export const LEGAL_TRADER = {
  fullName: {
    label: "Name",
    value: "Matheus Paranhos, sole trader (empresário em nome individual)",
  },
  tradingName: {
    label: "Trading name",
    value: "Toone (Hexagonal.io)",
  },
  address: {
    label: "Geographic address",
    value: "R. António Manuel Frutuoso 54, 3700-042 São João da Madeira (Porto Metropolitan Area), Portugal",
  },
  email: {
    label: "Email",
    value: "hello@trytoone.com",
    href: "mailto:hello@trytoone.com",
  },
  phone: {
    label: "Telephone",
    value: `${TODO_OWNER}: telephone number with country code`,
  },
  taxId: {
    label: "NIF / VAT number",
    value: "PT308520050",
  },
  activityCode: {
    label: "Activity code (CAE)",
    value: `${TODO_OWNER}: CAE code(s) of the open activity at Finanças`,
  },
  complaintsBook: {
    label: "Livro de Reclamações Eletrónico",
    value: `${TODO_OWNER}: Livro de Reclamações Eletrónico link for this trader`,
  },
  adrEntity: {
    label: "Alternative dispute resolution entity",
    value: `${TODO_OWNER}: ADR entity name, website and address (Lei 144/2015)`,
  },
} satisfies Record<string, TraderField>;

export type TraderKey = keyof typeof LEGAL_TRADER;

export function isOwnerPlaceholder(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(TODO_OWNER);
}

/** Fields whose value (or link) still waits for the owner. Empty means ready to release. */
export function unresolvedTraderFields(): TraderKey[] {
  return (Object.keys(LEGAL_TRADER) as TraderKey[]).filter((key) => {
    const field: TraderField = LEGAL_TRADER[key];
    return isOwnerPlaceholder(field.value) || isOwnerPlaceholder(field.href) || !field.value.trim();
  });
}

/** True once the owner has filled in every trader field: the Legal notice can be published. */
export const TRADER_DETAILS_COMPLETE: boolean = unresolvedTraderFields().length === 0;
