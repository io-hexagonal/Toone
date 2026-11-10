/**
 * `/cancel-contract/confirm#token=…`, the link the contract request email
 * carries. The token lives in the fragment only (never sent to a server or
 * an analytics request), is removed from the address before anything else
 * runs, and is spent only by an explicit "Confirm" click: mail scanners open
 * links, so loading the page must never change anything.
 */

import { billingFailure, type ContractConfirmation } from "@/lib/billing/api";

/** Where the inline head script parks the token it removed from the address. */
export const CONTRACT_TOKEN_GLOBAL = "__tooneContractToken";

/** The server's token: base64url, 32–128 characters. */
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

/**
 * Runs inline while the HTML is parsed: if the fragment carries `token`,
 * keeps it in memory and rewrites the address without the fragment.
 */
export const STRIP_CONTRACT_TOKEN_SCRIPT = `(function(){try{var h=window.location.hash;if(!h||h.indexOf("token=")<0)return;window.${CONTRACT_TOKEN_GLOBAL}=new URLSearchParams(h.slice(1)).get("token")||"";window.history.replaceState(window.history.state,"",window.location.pathname+window.location.search);}catch(e){}})();`;

/** The token in a `#token=…` fragment, or null when there is none or it is malformed. */
export function tokenFromFragment(hash: string): string | null {
  if (!hash || hash.length > 512) return null;
  let value: string | null;
  try {
    value = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  } catch {
    return null;
  }
  return validToken(value);
}

function validToken(value: unknown): string | null {
  return typeof value === "string" && TOKEN.test(value) ? value : null;
}

type ConfirmWindow = {
  location: { hash: string; pathname: string; search: string };
  history: { state: unknown; replaceState(data: unknown, unused: string, url?: string | URL | null): void };
  [CONTRACT_TOKEN_GLOBAL]?: unknown;
};

/**
 * The token to confirm: the one the head script removed, else one still in
 * the fragment (removed now). It is kept in memory only: after a reload the
 * emailed link is opened again.
 */
export function takeContractToken(win: ConfirmWindow | undefined): string | null {
  if (!win) return null;
  if (CONTRACT_TOKEN_GLOBAL in win) {
    const parked = validToken(win[CONTRACT_TOKEN_GLOBAL]);
    delete win[CONTRACT_TOKEN_GLOBAL];
    return parked;
  }
  const { hash, pathname, search } = win.location;
  if (!hash || !hash.includes("token=")) return null;
  const token = tokenFromFragment(hash);
  win.history.replaceState(win.history.state, "", `${pathname}${search}`);
  return token;
}

/** `account.contractConfirm.*` copy for a confirmed request. */
export function outcomeCopy(confirmation: ContractConfirmation): {
  title: "cancelledTitle" | "withdrawnTitle" | "nothingTitle" | "doneTitle";
  body: "cancelledBody" | "withdrawnBody" | "nothingBody" | "doneBody";
  /** Offer a withdrawal request instead (a cancellation that changed nothing). */
  offerWithdraw: boolean;
} {
  switch (confirmation.outcome) {
    case "cancelled": return { title: "cancelledTitle", body: "cancelledBody", offerWithdraw: false };
    case "withdrawn": return { title: "withdrawnTitle", body: "withdrawnBody", offerWithdraw: false };
    case "nothing_to_cancel":
      return { title: "nothingTitle", body: "nothingBody", offerWithdraw: confirmation.kind === "cancel" };
    default: return { title: "doneTitle", body: "doneBody", offerWithdraw: false };
  }
}

export type ConfirmFailure =
  /** 404 (expired or unknown) or 400 (malformed): this link can't be used; start again. */
  | "expired"
  /** The link still works; try again in a moment. */
  | "errRate"
  | "errUnavailable"
  | "errGeneric";

/** What a failed confirmation shows. */
export function confirmFailure(error: unknown): ConfirmFailure {
  const failure = billingFailure(error);
  if (failure.kind === "rate_limited") return "errRate";
  if (failure.kind === "payments_unavailable") return "errUnavailable";
  if (failure.kind === "unknown" && (failure.status === 404 || failure.status === 400)) return "expired";
  return "errGeneric";
}
