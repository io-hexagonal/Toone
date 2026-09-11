"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import {
  ApiError, clearSession, createInvitation, listInvitations, loadSession, logout,
  type CreatedInvitation, type InvitationRecord, type ToneSession,
} from "@/lib/api";
import styles from "./InvitationAdminPage.module.css";

const statusLabels = { pending: "Pending", redeemed: "Signed up", expired: "Expired", revoked: "Revoked" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default function InvitationAdminPage() {
  const [session, setSession] = useState<ToneSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    syncSession();
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "toone.session" || event.key === null) syncSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const endSession = useCallback(() => { clearSession(); setSession(null); }, []);
  if (!ready) return <main className={styles.page}><p role="status">Checking your account…</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  return <InvitationWorkspace key={session.token} session={session} onSessionEnded={endSession} />;
}

function InvitationWorkspace({ session, onSessionEnded }: { session: ToneSession; onSessionEnded: () => void }) {
  const [records, setRecords] = useState<InvitationRecord[]>([]);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [name, setName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const creating = useRef(false);
  const active = useRef(true);

  const handleAccessError = useCallback((caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) {
      onSessionEnded();
      return true;
    }
    if (caught instanceof ApiError && caught.status === 403) {
      setAuthorized(false); setDenied(true); setCreated(null); setRecords([]);
      return true;
    }
    return false;
  }, [onSessionEnded]);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listInvitations(session.token);
      if (!active.current) return;
      setRecords(result); setAuthorized(true); setDenied(false);
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError("Could not load invitations. Please try again.");
    } finally {
      if (active.current) { setLoading(false); setChecking(false); }
    }
  }, [session.token, handleAccessError]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; };
  }, [refresh]);

  useEffect(() => {
    document.title = authorized ? "Invitations | Toone" : denied ? "Page not found | Toone" : "Account | Toone";
  }, [authorized, denied]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (creating.current) return;
    const canonical = customCode.toUpperCase().replace(/[\s-]/g, "");
    if (customCode && !/^[A-Z0-9]{12,64}$/.test(canonical)) {
      setFormError("Use 12–64 letters or digits for a custom code. Spaces and hyphens are allowed.");
      return;
    }
    creating.current = true;
    setBusy(true); setFormError(""); setCopyFeedback("");
    try {
      const result = await createInvitation(session.token, { recipient_name: name.trim(), code: customCode, days });
      if (!active.current) return;
      setCreated(result); setName(""); setCustomCode("");
      await refresh();
    } catch (caught) {
      if (!active.current || handleAccessError(caught)) return;
      if (caught instanceof ApiError && caught.status === 409) setFormError("That code has already been used for an invitation. Choose another code.");
      else if (caught instanceof ApiError && caught.status === 400) setFormError("Check the name, code and expiry, then try again.");
      else if (caught instanceof ApiError && caught.status === 429) setFormError("Too many requests. Wait a minute, then try again.");
      else setFormError("Could not confirm creation. Refresh the history before trying again; an invitation may have been created.");
    } finally { creating.current = false; if (active.current) setBusy(false); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopyFeedback(`${label} copied.`); }
    catch { setCopyFeedback("Copy was unavailable. Select and copy the link and code below."); }
  }

  async function signOut() {
    setSigningOut(true);
    await logout(session.token);
    onSessionEnded();
  }

  const message = created ? `Hi ${created.recipient_name},\nYou're invited to try Toone.\n\nSign up: ${created.signup_url}\nYour personal code: ${created.code}\n\nEnter your code, then create an account with your own email and password to download Toone.\nThis code can be used once and expires on ${formatDate(created.expires_at)}.` : "";
  const query = search.trim().toLowerCase();
  const filtered = records.filter(record => `${record.recipient_name} ${record.email} ${record.account_name} ${record.code_hint}`.toLowerCase().includes(query));

  if (denied) return (
    <main className={`${styles.page} ${styles.restricted}`}>
      <h1>Page not found</h1>
      <p>The page you’re looking for is unavailable.</p>
      <Link href="/">Return to Toone</Link>
    </main>
  );
  if (!authorized) return (
    <main className={`${styles.page} ${styles.restricted}`}>
      {checking ? <p role="status">Checking your account…</p> : <>
        <p role="alert">Could not verify access. Please try again.</p>
        <button onClick={() => void refresh()} disabled={loading}>{loading ? "Checking…" : "Try again"}</button>
      </>}
    </main>
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
          <div className={styles.account}><span>{session.user.email}</span><button onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div>
        </header>
        <div className={styles.title}><p className={styles.eyebrow}>Early access</p><h1>Invitations</h1><p>Invite someone by name. See their signup email when they join.</p></div>
            {error && <div className={styles.error} role="alert">{error} <button onClick={() => void refresh()} disabled={loading}>Try again</button></div>}
            {authorized && <>
              <section className={styles.createGrid} aria-label="Create and share an invitation">
                <form className={styles.panel} onSubmit={submit}>
                  <h2>New invitation</h2><p>All you need is their name.</p>
                  <label htmlFor="recipient-name">Person’s name</label>
                  <input id="recipient-name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Jane Doe" maxLength={160} required disabled={busy} autoComplete="off" />
                  <label htmlFor="custom-code">Custom code <span className={styles.muted}>(optional)</span></label>
                  <input id="custom-code" value={customCode} onChange={event => setCustomCode(event.target.value)} placeholder="Generate automatically" maxLength={80} autoComplete="off" spellCheck={false} disabled={busy} aria-describedby="code-help" />
                  <small id="code-help">Leave blank for a personal code. Custom codes need at least 12 letters or digits.</small>
                  <label htmlFor="invitation-expiry">Code expires in</label>
                  <select id="invitation-expiry" value={days} onChange={event => setDays(Number(event.target.value))} disabled={busy}><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select>
                  {formError && <p className={styles.formError} role="alert">{formError}</p>}
                  <button className={styles.primary} type="submit" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Generate invitation"}</button>
                </form>
                <div className={`${styles.panel} ${styles.share}`} aria-live="polite">
                  {created ? <>
                    <p className={styles.eyebrow}>Ready to share</p><h2>Invitation for {created.recipient_name}</h2>
                    <p>Send the link and code together.</p>
                    <label htmlFor="signup-link">Signup link</label><div className={styles.copyRow}><input id="signup-link" value={created.signup_url} readOnly /><button onClick={() => void copy(created.signup_url, "Link")}>Copy link</button></div>
                    <label htmlFor="personal-code">Personal code</label><div className={styles.copyRow}><input id="personal-code" className={styles.code} value={created.code} readOnly /><button onClick={() => void copy(created.code, "Code")}>Copy code</button></div>
                    <small>One use · Expires {formatDate(created.expires_at)}</small>
                    <button className={styles.primary} onClick={() => void copy(message, "Invitation")}>Copy invitation message</button>
                    <p className={styles.notice}>Copy this invitation before leaving or creating another. The full code is only shown now.</p>
                    <p className={styles.feedback} role="status">{copyFeedback}</p>
                  </> : <div className={styles.emptyShare}><span aria-hidden="true">↗</span><h2>Your invitation will appear here</h2><p>Generate a code, copy the message, and send it to the person you’re inviting.</p></div>}
                </div>
              </section>
              <section className={styles.history} aria-labelledby="history-heading">
                <div className={styles.historyHeading}><div><h2 id="history-heading">Invitation history</h2><p>{records.length} invitation{records.length === 1 ? "" : "s"} · {records.filter(item => item.status === "redeemed").length} signed up</p></div><button onClick={() => void refresh()} disabled={loading || busy}>{loading ? "Refreshing…" : "Refresh"}</button></div>
                {records.length > 0 && <input className={styles.search} aria-label="Search invitations" placeholder="Search by name or email" value={search} onChange={event => setSearch(event.target.value)} />}
                {records.length === 0 ? <div className={styles.emptyHistory}><h3>No invitations yet</h3><p>Your first invitation will appear here. Their email is added when they sign up.</p></div> : <div className={styles.tableScroll}><table><thead><tr><th>Person invited</th><th>Status</th><th>Signup email</th><th>Signed up</th><th>Code expires</th></tr></thead><tbody>
                  {filtered.map(record => <tr key={record.id}><td><strong>{record.recipient_name}</strong><small>Code ending {record.code_hint || "—"}</small></td><td><span className={styles.status} data-status={record.status}>{statusLabels[record.status]}</span></td><td>{record.email || "—"}</td><td>{formatDate(record.used_at)}</td><td>{formatDate(record.expires_at)}</td></tr>)}
                  {filtered.length === 0 && <tr><td colSpan={5}>No invitations match your search.</td></tr>}
                </tbody></table></div>}
                <p className={styles.notice}>Showing the latest 500 invitations. “Signed up” means the account was created; it does not confirm a download.</p>
              </section>
            </>}
      </div>
    </main>
  );
}
