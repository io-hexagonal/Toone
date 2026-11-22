"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import {
  ADMIN_TOKEN_NAME_MAX,
  adminTokenNameProblem,
  adminTokenState,
  createAdminToken,
  listAdminTokens,
  revokeAdminToken,
  type AdminApiToken,
  type CreatedAdminApiToken,
} from "@/lib/affiliates";
import shell from "@/components/InvitationAdminPage.module.css";

const stateLabel = { active: "Active", revoked: "Revoked", expired: "Expired" } as const;
const stateStyle = { active: "redeemed", revoked: "revoked", expired: "expired" } as const;

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function formatUse(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";
}

function tokenError(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    if (caught.status === 400) return caught.message ? `The server refused it: ${caught.message}` : "Check the name, then try again.";
    if (caught.status === 409) return "You have the most live tokens allowed. Revoke one first.";
    if (caught.status === 429) return "Too many requests. Wait a minute, then try again.";
  }
  return fallback;
}

/**
 * Admin API tokens for scripts that create and manage affiliates without a
 * browser session. A token acts as the admin who made it, only on the
 * affiliates admin routes. The token itself is shown once, at creation.
 */
export default function AdminTokensPanel({ sessionToken, onAccessError }: {
  sessionToken: string;
  onAccessError: (caught: unknown) => boolean;
}) {
  const [tokens, setTokens] = useState<AdminApiToken[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState("");
  const [name, setName] = useState("");
  const [created, setCreated] = useState<CreatedAdminApiToken | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const active = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listAdminTokens(sessionToken);
      if (active.current) { setTokens(result); setAvailable(true); }
    } catch (caught) {
      if (!active.current || onAccessError(caught)) return;
      if (caught instanceof ApiError && caught.status === 404) { setAvailable(false); return; }
      setError("Could not load API tokens.");
    } finally { if (active.current) setLoading(false); }
  }, [sessionToken, onAccessError]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; };
  }, [refresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const problem = adminTokenNameProblem(name);
    if (problem) { setFormError(problem); document.getElementById("admin-token-name")?.focus(); return; }
    setBusy(true); setFormError(""); setFeedback("");
    try {
      const response = await createAdminToken(sessionToken, { name });
      if (!active.current) return;
      setCreated(response); setName("");
      await refresh();
    } catch (caught) {
      if (active.current && !onAccessError(caught)) setFormError(tokenError(caught, "Could not create the token. Refresh the list before trying again."));
    } finally { if (active.current) setBusy(false); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setFeedback("Token copied."); }
    catch { setFeedback("Copy was unavailable. Select and copy it from the field."); }
  }

  async function revoke(record: AdminApiToken) {
    if (rowBusy) return;
    if (!window.confirm(`Revoke “${record.name}”? Scripts using it stop working at once. This cannot be undone.`)) return;
    setRowBusy(record.id); setError("");
    try {
      await revokeAdminToken(sessionToken, record.id);
      if (created?.id === record.id) setCreated(null);
      await refresh();
    } catch (caught) {
      if (active.current && !onAccessError(caught)) setError(tokenError(caught, "Could not revoke that token. Refresh and try again."));
    } finally { if (active.current) setRowBusy(""); }
  }

  if (!available) return null;

  return (
    <section className={shell.history} aria-labelledby="admin-tokens-heading">
      <div className={shell.historyHeading}>
        <div>
          <h2 id="admin-tokens-heading">API tokens</h2>
          <p>For scripts that create and manage affiliates without signing in here. A token acts as you, only on the affiliates admin routes.</p>
        </div>
        <button onClick={() => void refresh()} disabled={loading || busy}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <div className={shell.error} role="alert">{error}</div>}
      <section className={shell.createGrid} aria-label="Create an API token">
        <form className={shell.panel} onSubmit={submit} noValidate>
          <h2>New token</h2>
          <label htmlFor="admin-token-name">Name</label>
          <input id="admin-token-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. creator scripts on my Mac" maxLength={ADMIN_TOKEN_NAME_MAX} disabled={busy} autoComplete="off" />
          <small>Scope: affiliates (list, create, update, new creator link). No expiry; revoke it here when it is no longer needed.</small>
          {formError && <p className={shell.formError} role="alert">{formError}</p>}
          <button className={shell.primary} type="submit" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create token"}</button>
        </form>
        <div className={`${shell.panel} ${shell.share}`} aria-live="polite">
          {created ? <>
            <p className={shell.eyebrow}>Copy it now</p>
            <h2>{created.name}</h2>
            <label htmlFor="created-admin-token">API token</label>
            <div className={shell.copyRow}>
              <input id="created-admin-token" className={shell.code} value={created.token} readOnly spellCheck={false} autoComplete="off" onFocus={(e) => e.currentTarget.select()} />
              <button onClick={() => void copy(created.token)}>Copy</button>
            </div>
            <p className={shell.notice}>This is the only time the token is shown. Store it in a password manager or the macOS Keychain, never in a file, chat or repository. Anyone with it can create and change affiliates as you. If it leaks, revoke it below.</p>
            <button onClick={() => { setCreated(null); setFeedback(""); }}>I stored it, hide it</button>
            <p className={shell.feedback} role="status">{feedback}</p>
          </> : <div className={shell.emptyShare}><span aria-hidden="true">⚿</span><h2>The new token will appear here once</h2><p>Name it after where it will be used, so you know which one to revoke.</p></div>}
        </div>
      </section>
      <div className={shell.history}>{tokens.length === 0 ? <div className={shell.emptyHistory}><h3>No API tokens yet</h3><p>Tokens you create will appear here.</p></div> : <div className={shell.tableScroll}><table><thead><tr>
        <th>Name</th><th>Token</th><th>Created</th><th>Last used</th><th>Status</th><th></th>
      </tr></thead><tbody>
        {tokens.map((record) => {
          const state = adminTokenState(record);
          return <tr key={record.id}>
            <td><strong>{record.name}</strong><small>{record.scopes.join(", ")}</small></td>
            <td><span className={shell.code}>…{record.token_hint}</span></td>
            <td>{formatDate(record.created_at)}</td>
            <td>{formatUse(record.last_used_at)}</td>
            <td><span className={shell.status} data-status={stateStyle[state]}>{stateLabel[state]}</span>{record.revoked_at ? <small>{formatDate(record.revoked_at)}</small> : record.expires_at ? <small>Expires {formatDate(record.expires_at)}</small> : null}</td>
            <td>{state === "active" && <button type="button" onClick={() => void revoke(record)} disabled={Boolean(rowBusy)}>{rowBusy === record.id ? "Revoking…" : "Revoke"}</button>}</td>
          </tr>;
        })}
      </tbody></table></div>}</div>
    </section>
  );
}
