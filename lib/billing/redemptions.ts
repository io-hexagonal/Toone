/**
 * Admin redemption ledger of one code (`GET /admin/invitations/{id}/redemptions`),
 * paged by an opaque cursor: `?limit=&cursor=` → `{entries, has_more, next_cursor}`.
 */

import { authedRequest } from "../api";
import { asBillingError } from "./errors";
import { normalizeBenefit, type CodeBenefit } from "./api";

export type CodeLedgerEntry = {
  redeemed_at: string;
  /** Null once the account was erased. */
  account_id: string | null;
  /** `signup` or `account`; other values are shown as sent. */
  channel: string;
  /** The benefit as it was when redeemed. */
  benefit: CodeBenefit;
};

export type CodeLedgerPage = {
  entries: CodeLedgerEntry[];
  has_more: boolean;
  /** Pass back as `cursor` for the next page; null when the server sent none. */
  next_cursor: string | null;
};

export const REDEMPTIONS_PAGE_SIZE = 50;

function text(entry: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) if (typeof entry[key] === "string" && entry[key]) return entry[key] as string;
  return "";
}

export function normalizeCodeLedgerPage(raw: unknown): CodeLedgerPage {
  const page = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw) ? raw : Array.isArray(page?.entries) ? (page.entries as unknown[]) : [];
  const entries = list.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const entry = item as Record<string, unknown>;
    return [{
      redeemed_at: text(entry, "redeemed_at", "created_at"),
      account_id: text(entry, "account_id", "user_id") || null,
      channel: text(entry, "channel"),
      benefit: normalizeBenefit(entry),
    }];
  });
  const cursor = page?.next_cursor;
  return {
    entries,
    has_more: page?.has_more === true,
    next_cursor: typeof cursor === "string" && cursor ? cursor : null,
  };
}

/**
 * One page of a code's redemptions, newest first. Pass the previous page's
 * `next_cursor` as `cursor`. `loaded` is the number of entries already shown;
 * it is only sent when there is no cursor (servers that page by offset).
 */
export async function listCodeLedger(
  token: string,
  invitationId: string,
  options: { cursor?: string | null; loaded?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<CodeLedgerPage> {
  const query = new URLSearchParams();
  query.set("limit", String(options.limit ?? REDEMPTIONS_PAGE_SIZE));
  if (options.cursor) query.set("cursor", options.cursor);
  else if (options.loaded) query.set("offset", String(options.loaded));
  try {
    const raw = await authedRequest<unknown>(
      token,
      `/admin/invitations/${encodeURIComponent(invitationId)}/redemptions?${query}`,
      { signal: options.signal },
    );
    return normalizeCodeLedgerPage(raw);
  } catch (error) {
    throw asBillingError(error);
  }
}
