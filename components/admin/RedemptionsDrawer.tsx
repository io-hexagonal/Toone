"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminCodeInvitation } from "@/lib/billing/api";
import { listCodeLedger, type CodeLedgerEntry } from "@/lib/billing/redemptions";
import { trapFocus } from "@/lib/focus-trap";
import { benefitLabel } from "./code-form";
import shell from "@/components/InvitationAdminPage.module.css";
import styles from "./CodesAdmin.module.css";

const channelLabels: Record<string, string> = { signup: "Signup", account: "Existing account" };

function formatDateTime(value: string) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
}

/** Side panel with the paged redemption ledger of one code. */
export default function RedemptionsDrawer({ token, invitation, onClose, onAccessError }: {
  token: string;
  invitation: AdminCodeInvitation;
  onClose: () => void;
  onAccessError: (caught: unknown) => boolean;
}) {
  const [entries, setEntries] = useState<CodeLedgerEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const load = useCallback(async (reset: boolean, after: string | null) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true); setError("");
    try {
      const page = await listCodeLedger(token, invitation.id, { cursor: after, signal: current.signal });
      if (current.signal.aborted) return;
      setEntries((previous) => (reset ? page.entries : [...previous, ...page.entries]));
      setCursor(page.next_cursor);
      setHasMore(page.has_more);
    } catch (caught) {
      if (current.signal.aborted || onAccessError(caught)) return;
      setError("Could not load redemptions. Please try again.");
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, [token, invitation.id, onAccessError]);

  useEffect(() => {
    void load(true, null);
    return () => controller.current?.abort();
  }, [load]);

  // Modal while open: Tab stays inside, Escape closes, and focus goes back to
  // what opened the drawer (its "Redemptions" button) once it closes.
  useEffect(() => {
    const release = dialog.current ? trapFocus(dialog.current) : () => {};
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); release(); };
  }, []);

  return (
    <div className={styles.drawerBackdrop} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={dialog} className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="redemptions-title">
        <div className={styles.drawerHeader}>
          <div>
            <p className={shell.eyebrow}>Redemptions</p>
            <h2 id="redemptions-title">{invitation.recipient_name}</h2>
            <p className={shell.muted}>Code ending {invitation.code_hint || "—"} · {benefitLabel(invitation.benefit)} · {invitation.use_count} use{invitation.use_count === 1 ? "" : "s"}</p>
          </div>
          <button ref={closeButton} type="button" onClick={onClose}>Close</button>
        </div>
        {error && <p className={shell.error} role="alert">{error} <button type="button" onClick={() => void load(entries.length === 0, entries.length === 0 ? null : cursor)}>Try again</button></p>}
        {entries.length === 0 && !loading && !error ? (
          <div className={shell.emptyHistory}><h3>No redemptions yet</h3><p>Every signup or redemption with this code appears here.</p></div>
        ) : (
          <div className={shell.tableScroll}><table><thead><tr><th>When</th><th>How</th><th>Account</th><th>Benefit</th></tr></thead><tbody>
            {entries.map((entry, index) => <tr key={`${entry.redeemed_at}-${entry.account_id ?? "erased"}-${index}`}>
              <td>{formatDateTime(entry.redeemed_at)}</td>
              <td>{channelLabels[entry.channel] ?? (entry.channel || "—")}</td>
              <td>{entry.account_id ?? <span className={shell.muted}>Deleted account</span>}</td>
              <td>{benefitLabel(entry.benefit)}</td>
            </tr>)}
          </tbody></table></div>
        )}
        <div className={styles.drawerFooter}>
          <span className={shell.muted} role="status">{loading ? "Loading…" : `${entries.length} shown`}</span>
          {hasMore && <button type="button" disabled={loading} onClick={() => void load(false, cursor)}>Load more</button>}
        </div>
      </aside>
    </div>
  );
}
