import { CURRENT_TERMS_VERSION } from "./terms-versions";

/**
 * This informational page does not submit a custom EULA to App Store Connect.
 * Apple's standard EULA applies to the Store edition while no custom EULA is
 * configured in App Store Connect.
 */
export const TERMS_PATH = "/terms";
export const TERMS_CANONICAL = `https://trytoone.com/en${TERMS_PATH}`;
/** The current version's date as the page shows it (lib/legal/terms-versions.ts keeps every version). */
export const TERMS_UPDATED_DATE = CURRENT_TERMS_VERSION.label;
export const APPLE_STANDARD_EULA_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = "https://support.apple.com/en-us/118428";
export const APPLE_REPORT_A_PROBLEM_URL = "https://reportaproblem.apple.com";

/** Web sales run on Stripe Managed Payments: the buyer sees "Sold through Link". */
export const LINK_TERMS_URL = "https://link.com/terms#sold-through-link-terms";
export const LINK_PRIVACY_URL = "https://link.com/privacy";
export const LINK_SUPPORT_URL = "https://support.link.com/topics/sold-through-link";
export const LINK_ACCOUNT_URL = "https://app.link.com";
export const STRIPE_PRIVACY_URL = "https://stripe.com/privacy";

/** Site pages the Terms link to. `/cancel-contract` and `/account` are built separately. */
export const LEGAL_NOTICE_PATH = "/legal-notice";
export const CANCEL_CONTRACT_PATH = "/cancel-contract";
export const ACCOUNT_PATH = "/account";
export const PRICING_PATH = "/pricing";

/** Toone Pro rules the Terms page states; they mirror the server's limits. */
export const TOONE_PRO_FREE_ROUTINE_CREATIONS = 2;
/** The free allowance before 2026-11-10, named only in the transition clause. */
export const TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS = 5;
export const TOONE_PRO_GUEST_PASSES = 5;
export const TOONE_PRO_GUEST_MONTH_DAYS = 30;
/**
 * Guest months from a web purchase become available this many days after
 * its withdrawal period ends (14 + 1 = 15 days after the purchase), and never
 * while a withdrawal of it is pending or once it is withdrawn.
 */
export const TOONE_PRO_GUEST_PASS_MARGIN_DAYS = 1;
/** Withdrawal window: the first paid Pro purchase of an account is refunded in full within it; a later subscription pro rata. */
export const TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS = 14;
/** Redeemable codes that grant days of Pro last at most this long. */
export const TOONE_PRO_CODE_MAX_DAYS = 365;
/** The emailed link that confirms a login-free request made before requests took effect on submission works this long. */
export const TOONE_PRO_CONTRACT_LINK_HOURS = 24;
