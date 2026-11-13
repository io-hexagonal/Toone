/**
 * The admin "New code" form: validation and the request body per benefit.
 * The server enforces every rule again; these checks only give early,
 * specific feedback.
 */

import { UNLIMITED_PRO_CODE_WARNING, type CreateCodeInvitationInput } from "@/lib/billing/api";

export type BenefitChoice = "signup" | "pro_days" | "pro_lifetime" | "free_creations";

export const BENEFIT_LABELS: Readonly<Record<BenefitChoice, string>> = {
  signup: "Signup only",
  pro_days: "Pro for N days",
  pro_lifetime: "Pro forever",
  free_creations: "+N free creations",
};

export type CodeFormState = {
  benefit: BenefitChoice;
  /** Days of Pro (`pro_days`) or extra creations (`free_creations`). */
  benefitValue: number;
  /** Benefit codes only: the code also lets a new person create an account. */
  admitsSignup: boolean;
  audience: "personal" | "shared";
  /** Shared codes: how many people may use it; 0 = unlimited. */
  maxUses: number;
  name: string;
  campaign: string;
  customCode: string;
  email: string;
  /** Validity in days, unless `expiresAt` is set. */
  days: number;
  /** `datetime-local` value; overrides `days` when set. */
  expiresAt: string;
};

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Signup-only codes keep the invitation limit; benefit codes may last a year. */
export const SIGNUP_MAX_DAYS = 30;
export const BENEFIT_MAX_DAYS = 365;
export const PRO_DAYS_MAX = 365;
export const FREE_CREATIONS_MAX = 50;
export const MAX_USES_MAX = 100_000;

export function maxValidityDays(benefit: BenefitChoice): number {
  return benefit === "signup" ? SIGNUP_MAX_DAYS : BENEFIT_MAX_DAYS;
}

export function validityOptions(benefit: BenefitChoice): number[] {
  return [1, 7, 14, 30, 90, 180, 365].filter((days) => days <= maxValidityDays(benefit));
}

/** Minimum letters/digits of a custom code. */
export function minimumCodeLength(state: Pick<CodeFormState, "benefit" | "audience">): number {
  if (state.audience === "personal") return 12;
  return state.benefit === "signup" ? 6 : 8;
}

export function grantsPro(benefit: BenefitChoice): boolean {
  return benefit === "pro_days" || benefit === "pro_lifetime";
}

/** True for a code anyone holding it can use any number of times to get Pro. */
export function unlimitedProWarning(state: Pick<CodeFormState, "benefit" | "audience" | "maxUses">): boolean {
  return grantsPro(state.benefit) && state.audience === "shared" && state.maxUses === 0;
}

export const EMPTY_CODE_FORM: Readonly<CodeFormState> = Object.freeze({
  benefit: "signup",
  benefitValue: 30,
  admitsSignup: false,
  audience: "personal",
  maxUses: 0,
  name: "",
  campaign: "",
  customCode: "",
  email: "",
  days: 7,
  expiresAt: "",
});

/** The input a validation error is about, by element id on the admin page. */
export type CodeFormField =
  | "recipient-name"
  | "custom-code"
  | "code-benefit-value"
  | "code-max-uses"
  | "code-expiry"
  | "code-expires-at"
  | "code-email"
  | "code-campaign";

export type CodeFormResult =
  | { ok: true; input: CreateCodeInvitationInput }
  | { ok: false; error: string; field: CodeFormField };

/** Checks the form and builds the `POST /admin/invitations` body. */
export function codeRequestFrom(state: CodeFormState, now = Date.now()): CodeFormResult {
  const name = state.name.trim();
  if (!name) return { ok: false, error: state.audience === "shared" ? "Enter a name for this code." : "Enter the person’s name.", field: "recipient-name" };
  if (name.length > 160) return { ok: false, error: "Keep the name under 160 characters.", field: "recipient-name" };

  const minimum = minimumCodeLength(state);
  const canonical = state.customCode.toUpperCase().replace(/[\s-]/g, "");
  if (state.customCode.trim() && !new RegExp(`^[A-Z0-9]{${minimum},64}$`).test(canonical)) {
    return { ok: false, error: `Use ${minimum}–64 letters or digits for a custom code. Spaces and hyphens are allowed.`, field: "custom-code" };
  }

  if (state.benefit === "pro_days" && !(Number.isInteger(state.benefitValue) && state.benefitValue >= 1 && state.benefitValue <= PRO_DAYS_MAX)) {
    return { ok: false, error: `Days of Pro must be a whole number from 1 to ${PRO_DAYS_MAX}.`, field: "code-benefit-value" };
  }
  if (state.benefit === "free_creations" && !(Number.isInteger(state.benefitValue) && state.benefitValue >= 1 && state.benefitValue <= FREE_CREATIONS_MAX)) {
    return { ok: false, error: `Extra creations must be a whole number from 1 to ${FREE_CREATIONS_MAX}.`, field: "code-benefit-value" };
  }

  if (state.audience === "shared" && !(Number.isInteger(state.maxUses) && state.maxUses >= 0 && state.maxUses <= MAX_USES_MAX)) {
    return { ok: false, error: `Max uses must be a whole number from 0 (unlimited) to ${MAX_USES_MAX}.`, field: "code-max-uses" };
  }
  if (state.audience === "shared" && state.maxUses === 1) {
    return { ok: false, error: "A shared code needs more than one use. Choose “One person” for a single use.", field: "code-max-uses" };
  }

  const maxDays = maxValidityDays(state.benefit);
  if (!(Number.isInteger(state.days) && state.days >= 1 && state.days <= maxDays)) {
    return { ok: false, error: `The code can be valid for at most ${maxDays} days.`, field: "code-expiry" };
  }
  let expiresAtISO: string | undefined;
  if (state.expiresAt) {
    const instant = new Date(state.expiresAt).getTime();
    if (!Number.isFinite(instant) || instant <= now || instant > now + maxDays * DAY_MS) {
      return { ok: false, error: `The exact expiry must be in the future and within ${maxDays} days.`, field: "code-expires-at" };
    }
    expiresAtISO = new Date(instant).toISOString();
  }

  const email = state.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address, or leave it blank to share the code yourself.", field: "code-email" };
  }
  const campaign = state.campaign.trim();
  if (campaign.length > 80) return { ok: false, error: "Keep the campaign label under 80 characters.", field: "code-campaign" };

  const input: CreateCodeInvitationInput = { recipient_name: name, code: state.customCode.trim(), days: state.days };
  if (state.audience === "shared") input.max_uses = state.maxUses;
  if (expiresAtISO) input.expires_at = expiresAtISO;
  if (email) input.email = email;
  if (campaign) input.campaign = campaign;
  if (state.benefit !== "signup") {
    input.benefit = state.benefit === "pro_lifetime"
      ? { kind: "pro_lifetime" }
      : { kind: state.benefit, value: state.benefitValue };
    input.admits_signup = state.admitsSignup;
  }
  return { ok: true, input };
}

/** Short description of a code's benefit for the list. */
export function benefitLabel(benefit: { kind: string; value: number | null }): string {
  switch (benefit.kind) {
    case "none":
      return "Signup only";
    case "pro_days":
      return benefit.value ? `Pro · ${benefit.value} day${benefit.value === 1 ? "" : "s"}` : "Pro · days";
    case "pro_lifetime":
      return "Pro forever";
    case "free_creations":
      return benefit.value ? `+${benefit.value} creation${benefit.value === 1 ? "" : "s"}` : "+ creations";
    default:
      return "Other benefit";
  }
}

/** The link to share: the signup page for codes that admit new accounts, /redeem otherwise. The code rides in the fragment. */
export function shareLink(options: { signupUrl: string; siteOrigin: string; code: string; admitsSignup: boolean }): string {
  const fragment = `#code=${encodeURIComponent(options.code)}`;
  if (options.admitsSignup && options.signupUrl) return `${options.signupUrl.split("#")[0]}${fragment}`;
  return `${options.siteOrigin.replace(/\/$/, "")}/redeem${fragment}`;
}

export function redeemLink(siteOrigin: string, code: string): string {
  return shareLink({ signupUrl: "", siteOrigin, code, admitsSignup: false });
}

/** Admin notes for the `warnings` of a created code; a warning this page does not know is shown by name. */
export function createdWarningNotes(warnings: readonly string[]): string[] {
  return warnings.map((warning) => warning === UNLIMITED_PRO_CODE_WARNING
    ? "The server flagged this as an unlimited Pro code: anyone who has it gets Toone Pro. Share it carefully and revoke it when the campaign ends."
    : `The server returned a warning: ${warning}.`);
}
