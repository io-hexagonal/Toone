"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ApiError, inviteEarlyAccessRequest, listEarlyAccessRequests,
  type EarlyAccessRequest, type EarlyAccessRequestPage, type EarlyAccessRequestStatus,
} from "@/lib/api";
import styles from "./InvitationAdminPage.module.css";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusLabels: Record<EarlyAccessRequestStatus, string> = { "": "All requests", pending: "Not invited yet", invited: "Invited" };

export default function EarlyAccessRequests({ token, onAccessError, onInvited }: {
  token: string;
  onAccessError: (error: unknown) => boolean;
  /** Called after an invitation is sent so the invitation list below can refresh. */
  onInvited: () => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EarlyAccessRequestStatus>("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState<EarlyAccessRequestPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState("");
  const [inviteNotice, setInviteNotice] = useState<{ text: string; failed?: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setPage(null);
    listEarlyAccessRequests(token, query, status, offset, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPage(result); })
      .catch(caught => {
        if (!controller.signal.aborted && !onAccessError(caught)) {
          setError("Could not load early-access requests. Please try again.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, query, status, offset, revision, onAccessError]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setQuery(search.trim()); setOffset(0); setRevision(value => value + 1);
  }

  function changeStatus(next: EarlyAccessRequestStatus) {
    setStatus(next); setOffset(0);
  }

  async function invite(entry: EarlyAccessRequest) {
    if (inviting) return;
    if (!window.confirm(`Send an invitation to ${entry.email}?\n\nToone creates a personal code and emails the link from invites@trytoone.com.`)) return;
    setInviting(entry.id); setInviteNotice(null);
    try {
      const created = await inviteEarlyAccessRequest(token, entry.id);
      const invitedAt = new Date().toISOString();
      setPage(current => current && { ...current, entries: current.entries.map(row => row.id === entry.id ? { ...row, invitation_id: created.id, invited_at: invitedAt } : row) });
      setInviteNotice({
        text: created.email_queued
          ? `Invitation emailed to ${entry.email} as ${created.recipient_name}. Code ending ${created.code.replace(/-/g, "").slice(-4)}; it expires ${formatWhen(created.expires_at)}. It is also listed under Invitations below.`
          : `Invitation created for ${entry.email}, but email is not enabled on the server. Share this code yourself: ${created.code}`,
      });
      onInvited();
    } catch (caught) {
      if (onAccessError(caught)) return;
      if (caught instanceof ApiError && caught.status === 409) {
        setInviteNotice({ text: `${entry.email} was already invited. The list has been refreshed.`, failed: true });
        setRevision(value => value + 1);
      } else if (caught instanceof ApiError && caught.status === 404) {
        setInviteNotice({ text: "That request no longer exists. The list has been refreshed.", failed: true });
        setRevision(value => value + 1);
      } else {
        setInviteNotice({ text: `Could not send an invitation to ${entry.email}. Try again.`, failed: true });
      }
    } finally { setInviting(""); }
  }

  const emptyTitle = query ? "No matching requests" : offset ? "No more requests" : status === "invited" ? "Nobody has been invited yet" : status === "pending" ? "Everyone has been invited" : "No early-access requests yet";
  const emptyBody = query ? "Try another email address or clear the search." : offset ? "Go back to the previous page." : status ? "Change the filter to see other requests." : "New requests from the early-access form will appear here.";

  return (
    <section className={styles.requests} aria-labelledby="requests-heading" aria-busy={loading}>
      <div className={styles.historyHeading}>
        <div><h2 id="requests-heading">Early-access requests</h2><p>People who asked to join Toone, newest first. Send an invitation straight from the list.</p></div>
        <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading}>Refresh</button>
      </div>
      <form className={styles.requestSearch} onSubmit={submitSearch}>
        <input type="search" aria-label="Search early-access requests by email" placeholder="Search by email" value={search} maxLength={254} onChange={event => setSearch(event.target.value)} />
        <button type="submit" disabled={loading}>Search</button>
        <select aria-label="Filter requests by invitation status" value={status} onChange={event => changeStatus(event.target.value as EarlyAccessRequestStatus)} disabled={loading}>
          {(Object.keys(statusLabels) as EarlyAccessRequestStatus[]).map(key => <option key={key} value={key}>{statusLabels[key]}</option>)}
        </select>
      </form>
      {inviteNotice && <p className={inviteNotice.failed ? styles.error : styles.inviteNotice} role={inviteNotice.failed ? "alert" : "status"}>{inviteNotice.text}</p>}
      {loading ? <p role="status">Loading requests…</p> : error ? (
        <p className={styles.error} role="alert">{error} <button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></p>
      ) : page && <>
        {page.entries.length === 0 ? <div className={styles.emptyHistory}><h3>{emptyTitle}</h3><p>{emptyBody}</p></div> : <div className={styles.tableScroll}><table>
          <thead><tr><th>Email address</th><th>Requested</th><th>Source</th><th>Invitation</th></tr></thead>
          <tbody>{page.entries.map(entry => <tr key={entry.id}>
            <td><strong>{entry.email}</strong></td>
            <td><time dateTime={entry.created_at}>{formatWhen(entry.created_at)}</time></td>
            <td>{entry.source === "web" ? "Website" : entry.source}</td>
            <td>{entry.invited_at
              ? <span className={styles.status} data-status="redeemed">Invited {formatWhen(entry.invited_at)}</span>
              : <button type="button" onClick={() => void invite(entry)} disabled={Boolean(inviting)}>{inviting === entry.id ? "Sending…" : "Send invite"}</button>}</td>
          </tr>)}</tbody>
        </table></div>}
        <div className={styles.requestPagination}>
          <p className={styles.notice} role="status">{page.entries.length ? `Showing ${offset + 1}–${offset + page.entries.length}${query ? " matching requests" : " requests"}` : "0 requests on this page"}</p>
          <div><button type="button" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - page.limit))}>Previous</button><button type="button" disabled={!page.has_more} onClick={() => setOffset(value => value + page.limit)}>Next</button></div>
        </div>
        <p className={styles.notice}>“Send invite” creates a personal single-use code, emails it to the requester, and marks the request as invited. Use the form below for custom codes or shared campaign codes.</p>
      </>}
    </section>
  );
}
