/**
 * Trader identity published on /en/legal-notice and referenced by the Terms
 * and the Privacy Policy. The owner fills in every TODO_OWNER value before
 * release; it must match the EU trader details on the App Store listing.
 *
 * Release gate: `LEGAL_RELEASE_CHECK=1 npm run test:legal` fails while any
 * value still starts with TODO_OWNER (tests/legal/release-owner-data.test.ts).
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
    value: `${TODO_OWNER}: full legal name of the individual trader`,
  },
  tradingName: {
    label: "Trading name",
    value: `${TODO_OWNER}: trading name (e.g. Hexagonal.io) and whether it is registered`,
  },
  address: {
    label: "Geographic address",
    value: `${TODO_OWNER}: street, postcode, city, Portugal`,
  },
  email: {
    label: "Email",
    value: `${TODO_OWNER}: contact email (e.g. hello@trytoone.com)`,
  },
  phone: {
    label: "Telephone",
    value: `${TODO_OWNER}: telephone number with country code`,
  },
  taxId: {
    label: "NIF / VAT number",
    value: `${TODO_OWNER}: NIF (and PT VAT number if different)`,
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
