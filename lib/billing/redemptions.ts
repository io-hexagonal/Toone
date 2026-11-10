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
  /** Pass back as `cursor` for the next page; null on the last page. */
  next_cursor: string | null;
};

/** The server's default page size (max 200). */
export const REDEMPTIONS_PAGE_SIZE = 50;

function text(entry: Record<string, unknown>, key: string): string {
  return typeof entry[key] === "string" ? (entry[key] as string) : "";
}

/** Reads `{entries, has_more, next_cursor}`; entries carry `benefit_kind` / `benefit_value`. */
export function normalizeCodeLedgerPage(raw: unknown): CodeLedgerPage {
  const page = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(page?.entries) ? (page.entries as unknown[]) : [];
  const entries = list.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const entry = item as Record<string, unknown>;
    return [{
      redeemed_at: text(entry, "redeemed_at"),
      account_id: text(entry, "account_id") || null,
      channel: text(entry, "channel"),
      benefit: normalizeBenefit(entry),
    }];
  });
  const cursor = page?.next_cursor;
  const nextCursor = typeof cursor === "string" && cursor ? cursor : null;
  return {
    entries,
    // Without a cursor there is no way to ask for the next page.
    has_more: page?.has_more === true && nextCursor !== null,
    next_cursor: nextCursor,
  };
}

/**
 * One page of a code's redemptions, newest first. Pass the previous page's
 * `next_cursor` as `cursor`; the first page has none.
 */
export async function listCodeLedger(
  token: string,
  invitationId: string,
  options: { cursor?: string | null; limit?: number; signal?: AbortSignal } = {},
): Promise<CodeLedgerPage> {
  const query = new URLSearchParams();
  query.set("limit", String(options.limit ?? REDEMPTIONS_PAGE_SIZE));
  if (options.cursor) query.set("cursor", options.cursor);
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
