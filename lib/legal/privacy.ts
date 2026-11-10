import type { TooneProSeller } from "@/lib/legal/seller";

export const PRIVACY_PATH = "/privacy";
export const PRIVACY_CANONICAL = `https://trytoone.com/en${PRIVACY_PATH}`;
export const PRIVACY_UPDATED_DATE = "November 10, 2026";

/** The contact for privacy requests, named on the page. */
export const PRIVACY_CONTACT = "hello@trytoone.com";
/** Toone is not for anyone under this age. */
export const PRIVACY_MIN_AGE = 16;

/**
 * Browser storage the website uses. The keys mirror the code that writes them:
 * `lib/site-session.ts`, `lib/api.ts`, `i18n/routing.ts` (LOCALE_CHOICE_COOKIE),
 * `lib/locale-preference.ts` and `lib/privacy-choices.ts`
 * (tests/legal/privacy.test.ts checks each one).
 */
export const ANALYTICS_CHOICE_STORAGE_KEY = "toone-web-analytics-choice-v1";
export const SESSION_STORAGE_KEY = "toone.session";

/**
 * Who receives personal data, in which role and where. Rendered as the
 * recipients table on /en/privacy. `sellers` limits a row to one seller model.
 */
export type PrivacyRecipient = {
  id: string;
  name: string;
  role: string;
  purpose: string;
  where: string;
  sellers?: readonly TooneProSeller[];
};

const TRANSFER_DPF_SCC =
  "EU-U.S. Data Privacy Framework and the European Commission's Standard Contractual Clauses";
const TRANSFER_SCC = "the European Commission's Standard Contractual Clauses";

export const PRIVACY_RECIPIENTS: readonly PrivacyRecipient[] = [
  {
    id: "vercel",
    name: "Vercel Inc.",
    role: "Processor",
    purpose:
      "Hosts the trytoone.com website. Receives your IP address, the pages you request and request headers in its logs.",
    where: `United States, with servers worldwide (${TRANSFER_DPF_SCC})`,
  },
  {
    id: "api-hosting",
    name: "Toone's server hosting provider",
    role: "Processor",
    purpose:
      "Runs Toone's server and database on a virtual private server: the account service, Toone Pro, codes, the cloud relay, Explore and the Silk Network.",
    where: "European Union",
  },
  {
    id: "stripe",
    name: "Stripe Payments Europe, Limited (Stripe)",
    role: "Processor for Toone's payments; independent controller for its own fraud-prevention, legal and compliance purposes",
    purpose: "Runs checkout, takes payments, renewals and refunds, and screens payments for fraud.",
    where: `Ireland, with onward transfers to Stripe's companies in the United States (${TRANSFER_DPF_SCC})`,
  },
  {
    id: "link",
    name: "Sold through Link, LLC (Link)",
    role: "Seller of the transaction (merchant of record) and independent controller",
    purpose:
      "Sells Toone Pro on trytoone.com, collects VAT or sales tax, sends receipts and invoices, and handles payment support.",
    where: "United States (under Link's privacy policy)",
    sellers: ["managed_payments"],
  },
  {
    id: "tax-authority",
    name: "Autoridade Tributária e Aduaneira (AT), the Portuguese tax authority",
    role: "Public authority (independent controller)",
    purpose:
      "Receives the details of each legal invoice and credit note, as Portuguese tax law requires: your name and tax number if you gave them, your country, the amount and the VAT.",
    where: "Portugal",
    sellers: ["direct"],
  },
  {
    id: "vies",
    name: "European Commission (VIES)",
    role: "Public authority (independent controller)",
    purpose: "Confirms that an EU VAT number given at checkout is valid.",
    where: "European Union",
    sellers: ["direct"],
  },
  {
    id: "accountant",
    name: "Toone's certified accountant",
    role: "Processor",
    purpose: "Keeps the books and files the tax returns, using the invoices and payment records.",
    where: "Portugal",
    sellers: ["direct"],
  },
  {
    id: "resend",
    name: "Resend, Inc.",
    role: "Processor",
    purpose:
      "Delivers the emails Toone sends, such as account emails, Business and guest-month invitations, Toone Pro notices, withdrawal and cancellation links and confirmations, and account deletion notices. Receives your email address, your name where the email uses it, and the message.",
    where: `United States (${TRANSFER_DPF_SCC})`,
  },
  {
    id: "openai",
    name: "OpenAI",
    role: "Processor",
    purpose:
      "Processes Explore submissions for the AI reviewer, and App Review requests during a review campaign, under Toone's own API account.",
    where: `United States (${TRANSFER_SCC})`,
  },
  {
    id: "discord",
    name: "Discord Inc.",
    role: "Service provider",
    purpose:
      "Receives the messages you send through the website's contact form, so the team can read and answer them.",
    where: `United States (${TRANSFER_SCC})`,
  },
  {
    id: "umami",
    name: "Umami analytics, self-hosted",
    role: "No third party: runs on a server Toone controls",
    purpose:
      "Counts website visits and clicks after you allow analytics, and receives Toone (Direct) usage events unless you turn them off.",
    where: "European Union",
  },
  {
    id: "apple",
    name: "Apple",
    role: "Independent controller",
    purpose:
      "Sign in with Apple, distribution of Toone (Mac App Store) and its updates, and App Store purchases.",
    where: "Ireland and the United States (under Apple's privacy policy)",
  },
  {
    id: "google",
    name: "Google",
    role: "Independent controller",
    purpose: "Sign in with Google, if you choose it.",
    where: "Ireland and the United States (under Google's privacy policy)",
  },
  {
    id: "github",
    name: "GitHub, Inc.",
    role: "Independent controller",
    purpose: "Hosts the Toone (Direct) update feeds, and any issue you choose to report there.",
    where: "United States (under GitHub's privacy statement)",
  },
];

export function privacyRecipients(seller: TooneProSeller): PrivacyRecipient[] {
  return PRIVACY_RECIPIENTS.filter((row) => !row.sellers || row.sellers.includes(seller));
}

/** Why Toone uses personal data, and the GDPR art. 6(1) basis for each purpose. */
export type PrivacyPurpose = { id: string; purpose: string; basis: string };

export const PRIVACY_PURPOSES: readonly PrivacyPurpose[] = [
  {
    id: "account",
    purpose: "Create and run your account and sign you in, including with Apple or Google",
    basis: "Contract (art. 6(1)(b))",
  },
  {
    id: "features",
    purpose: "Run the features you use: the cloud relay, Business, Live Share, Explore and the Silk Network",
    basis: "Contract (art. 6(1)(b))",
  },
  {
    id: "toone-pro",
    purpose:
      "Sell you Toone Pro and give it to the right account: checkout, payments, renewals, cancellations, withdrawals, refunds and the emails about them",
    basis: "Contract (art. 6(1)(b))",
  },
  {
    id: "records",
    purpose:
      "Keep invoices and payment records, and the records of your consent to Toone Pro starting straight away and of your withdrawal or cancellation requests",
    basis: "Legal obligation (art. 6(1)(c)): tax, accounting and consumer law",
  },
  {
    id: "abuse",
    purpose:
      "Apply the free plan once per person, stop a code or a guest month being used twice by the same person, and prevent payment fraud",
    basis: "Legitimate interest (art. 6(1)(f)) in a fair free plan and in preventing abuse",
  },
  {
    id: "security",
    purpose: "Keep the service secure, limit request rates and moderate Explore",
    basis: "Legitimate interest (art. 6(1)(f)) in a safe service",
  },
  {
    id: "claims",
    purpose: "Establish, exercise or defend legal claims, such as a payment dispute",
    basis: "Legitimate interest (art. 6(1)(f))",
  },
  {
    id: "app-analytics",
    purpose: "Understand how Toone (Direct) is used, from usage events you can turn off in Settings",
    basis: "Legitimate interest (art. 6(1)(f)) in improving Toone",
  },
  {
    id: "web-analytics",
    purpose: "Count visits and clicks on trytoone.com",
    basis: "Consent (art. 6(1)(a)), which you can withdraw at any time",
  },
  {
    id: "contact",
    purpose: "Answer your messages and administer the early-access waitlist",
    basis:
      "Steps you asked for before a contract (art. 6(1)(b)), and legitimate interest (art. 6(1)(f)) in answering you",
  },
];

/**
 * How long each kind of data is kept. `confirm: true` marks a period that
 * counsel, the accountant or the owner still has to confirm before release;
 * it is never rendered. The details live in the compliance checklist kept
 * with the payments plan, outside this repository.
 */
export type PrivacyRetention = {
  id: string;
  data: string;
  period: string;
  why?: string;
  confirm?: true;
};

export const PRIVACY_PAYMENT_RECORD_YEARS = 10;
export const PRIVACY_CONTRACT_REQUEST_YEARS = 3;

export function privacyRetention(seller: TooneProSeller): PrivacyRetention[] {
  const invoices: PrivacyRetention =
    seller === "direct"
      ? {
          id: "invoices",
          data: "Legal invoices and credit notes",
          period: `${PRIVACY_PAYMENT_RECORD_YEARS} years after the end of the year they were issued in.`,
          why: "Portuguese tax law requires it.",
          confirm: true,
        }
      : {
          id: "invoices",
          data: "Receipts and invoices",
          period:
            "Link issues and keeps them under its own policy. Toone keeps the payment records described above.",
        };
  return [
    {
      id: "account",
      data: "Account data: name, email address, sign-in details and sessions",
      period:
        "While your account exists. Erased when you delete it. The website sign-in cookie lasts at most 30 days.",
    },
    {
      id: "payments",
      data:
        "Toone Pro payment records: the Stripe customer, checkout, subscription and lifetime purchase records, amount, currency, discount, tax, refunds and disputes",
      period: `${PRIVACY_PAYMENT_RECORD_YEARS} years after the end of the year of the payment. After you delete your account they are no longer linked to it.`,
      why: "Tax and accounting law, and to handle refunds and disputes.",
      confirm: true,
    },
    invoices,
    {
      id: "consent",
      data:
        "The record of your consent to Toone Pro starting straight away: when you gave it and which version of the text you saw",
      period: "As long as the payment record it belongs to.",
      why: "To show what you agreed to if your withdrawal right is ever in question.",
      confirm: true,
    },
    {
      id: "contract-requests",
      data:
        "Withdrawal and cancellation requests: the kind of request, the name you gave, a keyed hash of the email address, the order, when it was made and confirmed, and the outcome",
      period: `${PRIVACY_CONTRACT_REQUEST_YEARS} years after the request.`,
      why: "To show that a request was received and carried out.",
      confirm: true,
    },
    {
      id: "code-redemptions",
      data: "Code redemptions: which code, when, by which account, where it was redeemed and what it gave",
      period:
        "While your account exists. When you delete your account, the email address is removed from the record and it is no longer linked to you.",
      confirm: true,
    },
    {
      id: "code-hash",
      data: "A keyed hash of the email address that redeemed a code, without the address itself",
      period: "As long as the code exists, including after you delete your account.",
      why: "So the same person cannot redeem the same code again with a new account.",
      confirm: true,
    },
    {
      id: "creation-bonuses",
      data: "Extra routine creations a code or Toone gave your account",
      period: "While your account exists. Deleted with it.",
    },
    {
      id: "creation-records",
      data: "Routine creations counted against the free plan",
      period:
        "While your account exists. Afterwards kept without your Toone identity, with Apple's app-transaction ID where there is one, so the free plan still applies once per Apple Account.",
    },
    {
      id: "guest-months",
      data: "Guest months",
      period:
        "A pending invitation is deleted when the person who sent it deletes their account. A keyed hash of each address that activated a guest month is kept, without the address, so each person receives at most one.",
    },
    {
      id: "app-store",
      data: "App Store purchase records",
      period: "While your account exists. Afterwards kept as records of the purchase, no longer linked to you.",
    },
    {
      id: "explore",
      data: "Explore listings and reports",
      period:
        "Listings stay published until you withdraw them or delete your account. Reports are kept as long as Toone needs them for moderation and safety.",
    },
    {
      id: "contact",
      data: "Waitlist entries and contact messages",
      period: "As long as needed to answer you and administer early access.",
      confirm: true,
    },
  ];
}
