"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listEarlyAccessRequests, type EarlyAccessRequestPage } from "@/lib/api";
import styles from "./InvitationAdminPage.module.css";

export default function EarlyAccessRequests({ token, onAccessError }: {
  token: string;
  onAccessError: (error: unknown) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState<EarlyAccessRequestPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setPage(null);
    listEarlyAccessRequests(token, query, offset, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPage(result); })
      .catch(caught => {
        if (!controller.signal.aborted && !onAccessError(caught)) {
          setError("Could not load early-access requests. Please try again.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, query, offset, revision, onAccessError]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setQuery(search.trim()); setOffset(0); setRevision(value => value + 1);
  }

  return (
    <section className={styles.requests} aria-labelledby="requests-heading" aria-busy={loading}>
      <div className={styles.historyHeading}>
        <div><h2 id="requests-heading">Early-access requests</h2><p>People who asked to join Toone, newest first.</p></div>
        <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading}>Refresh</button>
      </div>
      <form className={styles.requestSearch} onSubmit={submitSearch}>
        <input type="search" aria-label="Search early-access requests by email" placeholder="Search by email" value={search} maxLength={254} onChange={event => setSearch(event.target.value)} />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      {loading ? <p role="status">Loading requests…</p> : error ? (
        <p className={styles.error} role="alert">{error} <button type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></p>
      ) : page && <>
        {page.entries.length === 0 ? <div className={styles.emptyHistory}>
          <h3>{query ? "No matching requests" : offset ? "No more requests" : "No early-access requests yet"}</h3>
          <p>{query ? "Try another email address or clear the search." : offset ? "Go back to the previous page." : "New requests from the early-access form will appear here."}</p>
        </div> : <div className={styles.tableScroll}><table>
          <thead><tr><th>Email address</th><th>Requested</th><th>Source</th></tr></thead>
          <tbody>{page.entries.map(entry => <tr key={entry.id}>
            <td><strong>{entry.email}</strong></td>
            <td><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></td>
            <td>{entry.source === "web" ? "Website" : entry.source}</td>
          </tr>)}</tbody>
        </table></div>}
        <div className={styles.requestPagination}>
          <p className={styles.notice} role="status">{page.entries.length ? `Showing ${offset + 1}–${offset + page.entries.length}${query ? " matching requests" : " requests"}` : "0 requests on this page"}</p>
          <div><button type="button" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - page.limit))}>Previous</button><button type="button" disabled={!page.has_more} onClick={() => setOffset(value => value + page.limit)}>Next</button></div>
        </div>
        <p className={styles.notice}>These are requests for access. An invitation is only sent when you create one below and provide an email address.</p>
      </>}
    </section>
  );
}
