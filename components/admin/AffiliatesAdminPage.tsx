"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { ApiError, logout, type ToneSession } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import {
  COMMISSION_MAX,
  DISCOUNT_MAX,
  DISCOUNT_MIN,
  createAffiliate,
  discountText,
  formatMoney,
  listAffiliates,
  newCreatorCode,
  promotionCodeFromSlug,
  slugFromName,
  slugProblem,
  updateAffiliate,
  type Affiliate,
  type CreatedAffiliate,
} from "@/lib/affiliates";
import { EMPTY_AFFILIATE_FORM as EMPTY_FORM, affiliateRequestFrom, type AffiliateFormState as FormState } from "./affiliate-form";
import { accessOutcome } from "./access";
import AdminTokensPanel from "./AdminTokensPanel";
import shell from "@/components/InvitationAdminPage.module.css";
import styles from "./CodesAdmin.module.css";

const creatorStatus: Record<string, string> = { pending: "Not joined yet", joined: "Joined", expired: "Link expired", revoked: "Link replaced" };

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

/** The Lifetime price after a percent off, as Stripe charges it ($199.99 list; the discount is rounded, then subtracted). */
function lifetimePrice(percent: number): string {
  const list = 19999;
  return "$" + ((list - Math.round((list * percent) / 100)) / 100).toFixed(2);
}

function errorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    if (caught.status === 409) return caught.message && caught.message !== "resource already exists"
      ? `Already taken: ${caught.message}`
      : "That vanity link or promotion code is already taken. Choose another.";
    if (caught.status === 400) return caught.message ? `The server refused it: ${caught.message}` : "Check the fields, then try again.";
    if (caught.status === 503) return "The server could not set this up. Usual causes: the server's Stripe key lacks Coupons: Write and Promotion codes: Write (attach a promotion code made in Stripe instead), a lifetime-only discount with no active lifetime price, or benefit codes switched off.";
    if (caught.status === 429) return "Too many requests. Wait a minute, then try again.";
  }
  return fallback;
}

/** Signed-in gate, then the affiliate workspace. English only, like the rest of the admin. */
export default function AffiliatesAdminPage() {
  const { session, ready, setSession, endSession } = useStoredSession();
  if (!ready) return <main className={shell.page}><p role="status">Checking your account…</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  return <AffiliatesWorkspace key={session.token} session={session} onSessionEnded={endSession} />;
}

function AffiliatesWorkspace({ session, onSessionEnded }: { session: ToneSession; onSessionEnded: () => void }) {
  const [records, setRecords] = useState<Affiliate[]>([]);
  const [access, setAccess] = useState<"checking" | "authorized" | "denied">("checking");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [created, setCreated] = useState<CreatedAffiliate | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const creating = useRef(false);
  const active = useRef(true);

  const handleAccessError = useCallback((caught: unknown) => {
    const outcome = accessOutcome(caught);
    if (outcome === "session") { onSessionEnded(); return true; }
    if (outcome === "denied") { setAccess("denied"); setRecords([]); setCreated(null); return true; }
    return false;
  }, [onSessionEnded]);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listAffiliates(session.token);
      if (!active.current) return;
      setRecords(result); setAccess("authorized");
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError("Could not load affiliates. Please try again.");
    } finally {
      if (active.current) { setLoading(false); setChecked(true); }
    }
  }, [session.token, handleAccessError]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; };
  }, [refresh]);

  useEffect(() => {
    document.title = access === "authorized" ? "Affiliates | Toone" : access === "denied" ? "Page not found | Toone" : "Account | Toone";
  }, [access]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.slugEdited) next.slug = slugFromName(String(value));
      if (key === "slug") next.slugEdited = true;
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (creating.current) return;
    const result = affiliateRequestFrom(form);
    if (!result.ok) {
      setFormError(result.error);
      document.getElementById(result.field)?.focus();
      return;
    }
    creating.current = true;
    setBusy(true); setFormError(""); setCopyFeedback("");
    try {
      const response = await createAffiliate(session.token, result.input);
      if (!active.current) return;
      setCreated(response);
      setForm({ ...EMPTY_FORM, percent: form.percent, duration: form.duration, months: form.months, scope: form.scope, commission: form.commission });
      await refresh();
    } catch (caught) {
      if (!active.current || handleAccessError(caught)) return;
      setFormError(errorMessage(caught, "Could not confirm creation. Refresh the list before trying again; the affiliate may have been created."));
    } finally { creating.current = false; if (active.current) setBusy(false); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopyFeedback(`${label} copied.`); }
    catch { setCopyFeedback("Copy was unavailable. Select and copy it below."); }
  }

  async function toggle(record: Affiliate) {
    if (rowBusy) return;
    const pausing = record.status === "active";
    const confirmText = record.provider_managed === false
      ? `Pause ${record.name}'s link? The vanity link stops working, but the code ${record.promotion_code} was made in Stripe and keeps giving the discount (and counting sales) until you switch it off in Stripe. Sales already made stay in the report.`
      : `Pause ${record.name}'s link? The link and the code ${record.promotion_code} stop giving the discount until you resume it. Sales already made stay in the report.`;
    if (pausing && !window.confirm(confirmText)) return;
    setRowBusy(record.id); setError("");
    try {
      await updateAffiliate(session.token, record.id, { status: pausing ? "paused" : "active" });
      await refresh();
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError(errorMessage(caught, "Could not change that affiliate. Refresh and try again."));
    } finally { if (active.current) setRowBusy(""); }
  }

  async function changeShare(record: Affiliate) {
    if (rowBusy) return;
    const answer = window.prompt(`Revenue share for ${record.name}, in percent (0 to ${COMMISSION_MAX}). It applies to the whole report.`, String(record.commission_percent));
    if (answer === null) return;
    const value = Number(answer.trim());
    if (!Number.isInteger(value) || value < 0 || value > COMMISSION_MAX) { setError(`Revenue share: a whole number from 0 to ${COMMISSION_MAX}.`); return; }
    setRowBusy(record.id); setError("");
    try {
      await updateAffiliate(session.token, record.id, { commission_percent: value });
      await refresh();
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError(errorMessage(caught, "Could not change the revenue share."));
    } finally { if (active.current) setRowBusy(""); }
  }

  async function reissue(record: Affiliate) {
    if (rowBusy) return;
    if (!window.confirm(`Make a new creator link for ${record.name}? The old one stops working.`)) return;
    setRowBusy(record.id); setError(""); setCopyFeedback("");
    try {
      const response = await newCreatorCode(session.token, record.id);
      if (!active.current) return;
      setCreated(response);
      await refresh();
      document.getElementById("affiliate-share")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError(errorMessage(caught, "Could not make a new creator link."));
    } finally { if (active.current) setRowBusy(""); }
  }

  async function signOut() {
    setSigningOut(true);
    await logout(session.token);
    onSessionEnded();
  }

  if (access === "denied") return (
    <main className={`${shell.page} ${shell.restricted}`}>
      <h1>Page not found</h1>
      <p>The page you’re looking for is unavailable.</p>
      <Link href="/">Return to Toone</Link>
    </main>
  );
  if (access !== "authorized") return (
    <main className={`${shell.page} ${shell.restricted}`}>
      {!checked ? <p role="status">Checking your account…</p> : <>
        <p role="alert">Could not verify access. Please try again.</p>
        <button onClick={() => void refresh()} disabled={loading}>{loading ? "Checking…" : "Try again"}</button>
      </>}
    </main>
  );

  const siteOrigin = typeof window === "undefined" ? "https://trytoone.com" : window.location.origin;
  const slugPreview = form.slug ? `${siteOrigin.replace(/^https?:\/\//, "")}/r/${form.slug}` : "";
  const message = created
    ? `Hi ${created.affiliate.name},\n\nWelcome to Toone as a founding creator. Here is what you get:\n\n• Toone Pro for life. Join with this link: ${created.creator_join_url}\n• Your link to share: ${created.affiliate.link}\n• Your audience gets ${created.affiliate.discount_text || discountText(created.affiliate.discount)} with it, or with the code ${created.affiliate.promotion_code} at checkout.\n• Your share: ${created.affiliate.commission_percent}% of what those purchases bring in, paid monthly.\n\nAfter you join, your dashboard with visits and sales is at ${siteOrigin}/creators.\nIdeas to start with: ${siteOrigin}/en/creators/ideas`
    : "";

  return (
    <main className={shell.page}>
      <div className={shell.container}>
        <header className={shell.header}>
          <Link href="/" className={shell.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
          <div className={shell.account}><span>{session.user.email}</span><button onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div>
        </header>
        <div className={shell.title}>
          <p className={shell.eyebrow}>Admin</p>
          <h1>Affiliates</h1>
          <p>Create a creator&apos;s vanity link with a discount for their audience, send them the link that gives them Toone Pro for life, and see what their link sells. <Link href="/admin/codes">Codes</Link></p>
        </div>
        {error && <div className={shell.error} role="alert">{error} <button onClick={() => void refresh()} disabled={loading}>Refresh</button></div>}
        <section className={shell.createGrid} aria-label="Create an affiliate">
          <form className={shell.panel} onSubmit={submit} noValidate>
            <h2>New affiliate</h2>
            <p>Creates the Stripe discount, the vanity link and a single-use creator link with lifetime Pro.</p>
            <div className={styles.row2}>
              <div>
                <label htmlFor="affiliate-name">Creator name</label>
                <input id="affiliate-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Jane Doe" maxLength={120} disabled={busy} autoComplete="off" />
              </div>
              <div>
                <label htmlFor="affiliate-slug">Vanity link</label>
                <input id="affiliate-slug" value={form.slug} onChange={(e) => update("slug", e.target.value.toLowerCase())} placeholder="jane" maxLength={32} disabled={busy} autoComplete="off" spellCheck={false} aria-describedby="slug-help" />
              </div>
            </div>
            <small id="slug-help">{slugPreview ? <>{slugPreview} · checkout code <span className={shell.code}>{form.source === "existing" && form.existingCode ? form.existingCode.toUpperCase() : promotionCodeFromSlug(form.slug)}</span>{slugProblem(form.slug) ? ` · ${slugProblem(form.slug)}` : ""}</> : "Lowercase letters, digits and hyphens."}</small>

            <label htmlFor="affiliate-source">Discount</label>
            <select id="affiliate-source" value={form.source} onChange={(e) => update("source", e.target.value as FormState["source"])} disabled={busy}>
              <option value="new">Create a discount in Stripe</option>
              <option value="existing">Use a promotion code already in Stripe</option>
            </select>
            {form.source === "new" ? <>
              <label htmlFor="affiliate-percent">Percent off Toone Pro Lifetime</label>
              <input id="affiliate-percent" type="number" inputMode="numeric" min={DISCOUNT_MIN} max={DISCOUNT_MAX} step={1}
                value={Number.isFinite(form.percent) ? form.percent : ""} onChange={(e) => update("percent", e.target.valueAsNumber)} disabled={busy} />
              <small>{discountText({ percent: form.percent || 0, duration: "once", months: null, scope: "lifetime" })}{Number.isFinite(form.percent) && form.percent > 0 ? ` (Lifetime ${lifetimePrice(form.percent)})` : ""}. Creator codes apply to the Lifetime plan only: checkout does not take a code on monthly or yearly.</small>
            </> : <>
              <label htmlFor="affiliate-existing">Stripe promotion code</label>
              <input id="affiliate-existing" className={shell.code} value={form.existingCode} onChange={(e) => update("existingCode", e.target.value.toUpperCase())} placeholder="e.g. JANE20" maxLength={40} disabled={busy} autoComplete="off" spellCheck={false} />
              <small>Make a new code in Stripe first (Product catalog → Coupons → add a customer-facing code, with a minimum order of the Lifetime price). It must be unused, so the launch offer can never be attached. Pausing this affiliate will not switch it off in Stripe.</small>
            </>}

            <label htmlFor="affiliate-commission">Revenue share <span className={shell.muted}>(%, usually 20–30)</span></label>
            <input id="affiliate-commission" type="number" inputMode="numeric" min={0} max={COMMISSION_MAX} step={1}
              value={Number.isFinite(form.commission) ? form.commission : ""} onChange={(e) => update("commission", e.target.valueAsNumber)} disabled={busy} />
            <small>What you owe the creator from Lifetime sales made with their link or code, as a share of what the buyer paid. Send the creator the message from the panel once the affiliate is created.</small>
            {formError && <p className={shell.formError} role="alert">{formError}</p>}
            <button className={shell.primary} type="submit" disabled={busy || !form.name.trim()}>{busy ? "Creating…" : "Create affiliate"}</button>
          </form>
          <div id="affiliate-share" className={`${shell.panel} ${shell.share}`} aria-live="polite">
            {created ? <>
              <p className={shell.eyebrow}>Ready to send</p>
              <h2>{created.affiliate.name}</h2>
              <p><span className={styles.benefit} data-kind="pro_lifetime">Toone Pro for life</span> · {created.affiliate.discount_text || discountText(created.affiliate.discount)} · {created.affiliate.commission_percent}% share</p>
              <label htmlFor="created-join">Creator link (sign up or sign in, gets lifetime Pro)</label>
              <div className={shell.copyRow}><input id="created-join" value={created.creator_join_url} readOnly /><button onClick={() => void copy(created.creator_join_url, "Creator link")}>Copy</button></div>
              <label htmlFor="created-link">Vanity link to share with their audience</label>
              <div className={shell.copyRow}><input id="created-link" value={created.affiliate.link} readOnly /><button onClick={() => void copy(created.affiliate.link, "Vanity link")}>Copy</button></div>
              <label htmlFor="created-code">Checkout code</label>
              <div className={shell.copyRow}><input id="created-code" className={shell.code} value={created.affiliate.promotion_code} readOnly /><button onClick={() => void copy(created.affiliate.promotion_code, "Code")}>Copy</button></div>
              <button className={shell.primary} onClick={() => void copy(message, "Message")}>Copy message for the creator</button>
              <p className={shell.notice}>The creator link is shown only now and works once. If it gets lost, use “New creator link” in the list.</p>
              <p className={shell.feedback} role="status">{copyFeedback}</p>
            </> : <div className={shell.emptyShare}><span aria-hidden="true">↗</span><h2>The creator&apos;s links will appear here</h2><p>Create an affiliate, then copy the message and send it.</p></div>}
          </div>
        </section>

        <section className={shell.history} aria-labelledby="affiliates-heading">
          <div className={shell.historyHeading}>
            <div><h2 id="affiliates-heading">Affiliates</h2><p>{records.length} affiliate{records.length === 1 ? "" : "s"} · revenue share is payable 30 days after a sale</p></div>
            <button onClick={() => void refresh()} disabled={loading || busy}>{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
          {records.length === 0 ? <div className={shell.emptyHistory}><h3>No affiliates yet</h3><p>Your first affiliate will appear here.</p></div> : <div className={shell.tableScroll}><table><thead><tr>
            <th>Creator</th><th>Discount</th><th>Visits</th><th>Sales</th><th>Share owed</th><th>Creator</th><th></th>
          </tr></thead><tbody>
            {records.map((record) => <tr key={record.id}>
              <td>
                <strong>{record.name}</strong>
                <small><button type="button" className={shell.code} onClick={() => void copy(record.link, "Vanity link")} title="Copy vanity link">/r/{record.slug}</button> · code {record.promotion_code}</small>
                <small>{record.status === "paused" ? "Paused" : "Active"} · since {formatDate(record.created_at)}</small>
              </td>
              <td>{record.discount_text || discountText(record.discount)}{record.provider_managed === false && <small>Attached Stripe code</small>}</td>
              <td>{record.visits}</td>
              <td>{record.sales.length === 0 ? "—" : record.sales.map((row) => <div key={row.currency}>{row.sales} · {formatMoney(row.revenue, row.currency)}{row.refunded ? <small>{row.refunded} refunded</small> : null}</div>)}</td>
              <td>{record.sales.length === 0 ? `${record.commission_percent}%` : record.sales.map((row) => <div key={row.currency}>{formatMoney(row.payable_commission, row.currency)}<small>of {formatMoney(row.commission, row.currency)} at {record.commission_percent}%</small></div>)}</td>
              <td><span className={shell.status} data-status={record.creator?.status === "joined" ? "redeemed" : record.creator?.status ?? "expired"}>{creatorStatus[record.creator?.status ?? ""] ?? "—"}</span>{record.creator && !record.creator.joined && <small>Expires {formatDate(record.creator.expires_at)}</small>}</td>
              <td>
                <button type="button" onClick={() => void toggle(record)} disabled={Boolean(rowBusy)}>{rowBusy === record.id ? "Saving…" : record.status === "active" ? "Pause" : "Resume"}</button>{" "}
                <button type="button" onClick={() => void changeShare(record)} disabled={Boolean(rowBusy)}>Share %</button>{" "}
                {!record.creator?.joined && <button type="button" onClick={() => void reissue(record)} disabled={Boolean(rowBusy)}>New creator link</button>}
              </td>
            </tr>)}
          </tbody></table></div>}
          <p className={shell.feedback} role="status">{copyFeedback}</p>
          <p className={shell.notice}>Sales are completed Pro checkouts that used the affiliate&apos;s code, through the link or typed at checkout, counted at what the buyer paid on the first payment. Refunded lifetime purchases and withdrawn orders are left out. Renewals are not counted yet. Pay creators by bank transfer from the “Share owed” column.</p>
        </section>
        <AdminTokensPanel sessionToken={session.token} onAccessError={handleAccessError} />
      </div>
    </main>
  );
}
