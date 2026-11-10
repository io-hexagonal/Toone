"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import EarlyAccessRequests from "@/components/EarlyAccessRequests";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { logout, type ToneSession } from "@/lib/api";
import {
  billingFailure,
  createCodeInvitation,
  getBillingFeaturesOrOff,
  listCodeInvitations,
  revokeCodeInvitation,
  type AdminCodeInvitation,
  type CreatedCodeInvitation,
} from "@/lib/billing/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { accessOutcome, adminTitle } from "./access";
import {
  BENEFIT_LABELS,
  EMPTY_CODE_FORM,
  benefitLabel,
  codeRequestFrom,
  createdWarningNotes,
  grantsPro,
  maxValidityDays,
  minimumCodeLength,
  redeemLink,
  shareLink,
  unlimitedProWarning,
  validityOptions,
  type BenefitChoice,
  type CodeFormState,
} from "./code-form";
import RedemptionsDrawer from "./RedemptionsDrawer";
import shell from "@/components/InvitationAdminPage.module.css";
import styles from "./CodesAdmin.module.css";

const statusLabels = { pending: "Pending", redeemed: "Signed up", expired: "Expired", revoked: "Revoked" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}

function usesLabel(record: { max_uses: number; use_count: number }) {
  if (record.max_uses === 1) return record.use_count ? "1 person · used" : "1 person";
  return `${record.use_count} use${record.use_count === 1 ? "" : "s"}${record.max_uses ? ` of ${record.max_uses}` : " · unlimited"}`;
}

/** Signed-in gate, then the admin workspace. Strings are English-only, like the rest of the admin. */
export default function CodesAdminPage() {
  const { session, ready, setSession, endSession } = useStoredSession();
  if (!ready) return <main className={shell.page}><p role="status">Checking your account…</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  return <CodesWorkspace key={session.token} session={session} onSessionEnded={endSession} />;
}

function CodesWorkspace({ session, onSessionEnded }: { session: ToneSession; onSessionEnded: () => void }) {
  const [records, setRecords] = useState<AdminCodeInvitation[]>([]);
  const [access, setAccess] = useState<"checking" | "authorized" | "denied">("checking");
  const [checked, setChecked] = useState(false);
  const [benefitsOn, setBenefitsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [form, setForm] = useState<CodeFormState>({ ...EMPTY_CODE_FORM });
  const [search, setSearch] = useState("");
  const [created, setCreated] = useState<CreatedCodeInvitation | null>(null);
  const [createdNotes, setCreatedNotes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [revoking, setRevoking] = useState("");
  const [drawer, setDrawer] = useState<AdminCodeInvitation | null>(null);
  const creating = useRef(false);
  const active = useRef(true);

  const handleAccessError = useCallback((caught: unknown) => {
    const outcome = accessOutcome(caught);
    if (outcome === "session") { onSessionEnded(); return true; }
    if (outcome === "denied") {
      setAccess("denied"); setCreated(null); setRecords([]); setDrawer(null);
      return true;
    }
    return false;
  }, [onSessionEnded]);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listCodeInvitations(session.token);
      if (!active.current) return;
      setRecords(result); setAccess("authorized");
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError("Could not load codes. Please try again.");
    } finally {
      if (active.current) { setLoading(false); setChecked(true); }
    }
  }, [session.token, handleAccessError]);

  useEffect(() => {
    active.current = true;
    void refresh();
    // Benefit controls appear only once the server can store a benefit; an
    // older server would silently create a signup-only code.
    void getBillingFeaturesOrOff({ cache: "no-store" }).then((flags) => { if (active.current) setBenefitsOn(flags.pro_codes); });
    return () => { active.current = false; };
  }, [refresh]);

  useEffect(() => {
    document.title = adminTitle(access);
  }, [access]);

  function update<K extends keyof CodeFormState>(key: K, value: CodeFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // Keep the validity inside the limit of the chosen benefit.
      if (key === "benefit" && next.days > maxValidityDays(next.benefit)) next.days = 30;
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (creating.current) return;
    const state: CodeFormState = benefitsOn ? form : { ...form, benefit: "signup" };
    const result = codeRequestFrom(state);
    if (!result.ok) { setFormError(result.error); return; }
    if (unlimitedProWarning(state) && !window.confirm("This code gives Toone Pro to anyone who has it, with no limit on uses. Create it anyway?")) return;
    creating.current = true;
    setBusy(true); setFormError(""); setCopyFeedback("");
    try {
      const response = await createCodeInvitation(session.token, result.input);
      if (!active.current) return;
      const notes: string[] = [];
      notes.push(...createdWarningNotes(response.warnings));
      if (result.input.benefit && response.benefit.kind !== result.input.benefit.kind) {
        notes.push("The server did not record the benefit, so this code only admits signups. Revoke it if that is not what you wanted.");
      }
      setCreated(response); setCreatedNotes(notes);
      setForm((current) => ({ ...EMPTY_CODE_FORM, benefit: current.benefit, benefitValue: current.benefitValue, audience: current.audience, admitsSignup: current.admitsSignup }));
      await refresh();
    } catch (caught) {
      if (!active.current || handleAccessError(caught)) return;
      const failure = billingFailure(caught);
      const status = failure.kind === "unknown" ? failure.status : 0;
      if (status === 409) setFormError("That code is already in use. Choose another code.");
      else if (status === 400) setFormError(failure.kind === "unknown" && failure.message ? `The server refused the code: ${failure.message}` : "Check the fields, then try again.");
      else if (failure.kind === "rate_limited") setFormError("Too many requests. Wait a minute, then try again.");
      else setFormError("Could not confirm creation. Refresh the list before trying again; a code may have been created.");
    } finally { creating.current = false; if (active.current) setBusy(false); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopyFeedback(`${label} copied.`); }
    catch { setCopyFeedback("Copy was unavailable. Select and copy the link and code below."); }
  }

  async function revoke(record: AdminCodeInvitation) {
    if (revoking) return;
    const label = record.max_uses === 1 ? `the code for ${record.recipient_name}` : `the shared code “${record.recipient_name}”`;
    const kept = record.benefit.kind === "none" ? "Accounts already created keep working." : "Accounts already created keep working, and benefits already redeemed stay.";
    if (!window.confirm(`Revoke ${label}? Nobody can use it after this. ${kept}`)) return;
    setRevoking(record.id); setError("");
    try {
      await revokeCodeInvitation(session.token, record.id);
      await refresh();
    } catch (caught) {
      if (active.current && !handleAccessError(caught)) setError("Could not revoke that code. Refresh and try again.");
    } finally { if (active.current) setRevoking(""); }
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
  const createdAdmits = created ? created.admits_signup : true;
  const createdShared = created ? created.max_uses !== 1 : false;
  const primaryLink = created ? shareLink({ signupUrl: created.signup_url, siteOrigin, code: created.code, admitsSignup: createdAdmits }) : "";
  const secondaryLink = created && createdAdmits && created.benefit.kind !== "none" ? redeemLink(siteOrigin, created.code) : "";
  const createdBenefit = created ? benefitLabel(created.benefit) : "";
  const message = !created ? "" : createdAdmits
    ? createdShared
      ? `You're invited to try Toone.\n\nSign up: ${primaryLink}\nAccess code: ${created.code}\n\nOpen the link (or enter the code), then create an account with your own email and password to download Toone.${created.benefit.kind !== "none" ? `\nThe code also gives you: ${createdBenefit}. Already have an account? Redeem it at ${secondaryLink}` : ""}\nThis code expires on ${formatDateTime(created.expires_at)}.`
      : `Hi ${created.recipient_name},\nYou're invited to try Toone.\n\nSign up: ${primaryLink}\nYour personal code: ${created.code}\n\nOpen the link (or enter your code), then create an account with your own email and password to download Toone.${created.benefit.kind !== "none" ? `\nThe code also gives you: ${createdBenefit}.` : ""}\nThis code can be used once and expires on ${formatDate(created.expires_at)}.`
    : `${createdShared ? "" : `Hi ${created.recipient_name},\n`}Here is a Toone code: ${createdBenefit}.\n\nRedeem it: ${primaryLink}\nCode: ${created.code}\n\nSign in with your Toone account, then confirm. The code expires on ${formatDateTime(created.expires_at)}.`;

  const query = search.trim().toLowerCase();
  const filtered = records.filter((record) => `${record.recipient_name} ${record.email} ${record.account_name} ${record.code_hint} ${record.campaign}`.toLowerCase().includes(query));
  const benefit: BenefitChoice = benefitsOn ? form.benefit : "signup";
  const shared = form.audience === "shared";
  const warn = unlimitedProWarning({ ...form, benefit });
  const minimum = minimumCodeLength({ benefit, audience: form.audience });

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
        <div className={shell.title}><p className={shell.eyebrow}>Admin</p><h1>Codes</h1><p>Review early-access requests, create invitation and benefit codes, and see who used them.</p></div>
        {error && <div className={shell.error} role="alert">{error} <button onClick={() => void refresh()} disabled={loading}>Try again</button></div>}
        <EarlyAccessRequests token={session.token} onAccessError={handleAccessError} onInvited={() => void refresh()} />
        <section className={shell.createGrid} aria-label="Create and share a code">
          <form className={shell.panel} onSubmit={submit} noValidate>
            <h2>New code</h2>
            <p>{benefit === "signup" ? "Lets someone create an account while sign-ups are by invitation." : "Gives a signed-in account a benefit when redeemed."}</p>

            <label htmlFor="code-benefit">What it gives</label>
            <select id="code-benefit" value={benefit} onChange={(event) => update("benefit", event.target.value as BenefitChoice)} disabled={busy || !benefitsOn} aria-describedby={benefitsOn ? undefined : "benefit-off"}>
              {(Object.keys(BENEFIT_LABELS) as BenefitChoice[]).map((choice) => <option key={choice} value={choice}>{BENEFIT_LABELS[choice]}</option>)}
            </select>
            {!benefitsOn && <small id="benefit-off">Benefit codes are switched off on the server, so new codes are signup only.</small>}
            {(benefit === "pro_days" || benefit === "free_creations") && <>
              <label htmlFor="code-benefit-value">{benefit === "pro_days" ? "Days of Toone Pro" : "Extra free routine creations"}</label>
              <input id="code-benefit-value" type="number" inputMode="numeric" min={1} max={benefit === "pro_days" ? 365 : 50} step={1}
                value={Number.isFinite(form.benefitValue) ? form.benefitValue : ""} onChange={(event) => update("benefitValue", event.target.valueAsNumber)} disabled={busy} />
            </>}
            {benefit !== "signup" && (
              <label className={styles.toggle} htmlFor="code-admits">
                <input id="code-admits" type="checkbox" checked={form.admitsSignup} onChange={(event) => update("admitsSignup", event.target.checked)} disabled={busy} />
                <span>Also admits new accounts<small>People without an account can sign up with it and get the benefit. Off: only existing accounts can redeem it.</small></span>
              </label>
            )}

            <label htmlFor="code-uses">Who can use it</label>
            <select id="code-uses" value={form.audience} onChange={(event) => update("audience", event.target.value as CodeFormState["audience"])} disabled={busy}>
              <option value="personal">One person (single use)</option>
              <option value="shared">Shared code (many people)</option>
            </select>
            {shared && <>
              <label htmlFor="code-max-uses">Max uses <span className={shell.muted}>(0 = unlimited)</span></label>
              <input id="code-max-uses" type="number" inputMode="numeric" min={0} step={1}
                value={Number.isFinite(form.maxUses) ? form.maxUses : ""} onChange={(event) => update("maxUses", event.target.valueAsNumber)} disabled={busy} />
            </>}
            {warn && <p className={styles.warning} role="note">Unlimited + Pro: anyone who gets this code can have Toone Pro. Prefer a cap on uses and a short expiry.</p>}

            <div className={styles.row2}>
              <div>
                <label htmlFor="recipient-name">{shared ? "Name" : "Person’s name"}</label>
                <input id="recipient-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={shared ? "e.g. Product Hunt" : "e.g. Jane Doe"} maxLength={160} required disabled={busy} autoComplete="off" />
              </div>
              <div>
                <label htmlFor="code-campaign">Campaign <span className={shell.muted}>(optional)</span></label>
                <input id="code-campaign" value={form.campaign} onChange={(event) => update("campaign", event.target.value)} placeholder="e.g. launch-2026" maxLength={80} disabled={busy} autoComplete="off" />
              </div>
            </div>
            <label htmlFor="code-email">Email it to <span className={shell.muted}>(optional)</span></label>
            <input id="code-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Leave blank to share it yourself" maxLength={254} autoComplete="off" disabled={busy} aria-describedby="email-help" />
            <small id="email-help">Toone emails the link and code from invites@trytoone.com.</small>
            <label htmlFor="custom-code">Custom code <span className={shell.muted}>(optional)</span></label>
            <input id="custom-code" value={form.customCode} onChange={(event) => update("customCode", event.target.value)} placeholder="Generate automatically" maxLength={80} autoComplete="off" spellCheck={false} disabled={busy} aria-describedby="code-help" />
            <small id="code-help">Leave blank for a generated code. Custom codes need at least {minimum} letters or digits.</small>
            <div className={styles.row2}>
              <div>
                <label htmlFor="code-expiry">Code expires in</label>
                <select id="code-expiry" value={form.days} onChange={(event) => update("days", Number(event.target.value))} disabled={busy || Boolean(form.expiresAt)}>
                  {validityOptions(benefit).map((days) => <option key={days} value={days}>{days} day{days === 1 ? "" : "s"}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="code-expires-at">Exact expiry <span className={shell.muted}>(optional)</span></label>
                <input id="code-expires-at" type="datetime-local" value={form.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} disabled={busy} />
              </div>
            </div>
            <small>At most {maxValidityDays(benefit)} days{grantsPro(benefit) ? "; the Pro days start when the code is redeemed" : ""}.</small>
            {formError && <p className={shell.formError} role="alert">{formError}</p>}
            <button className={shell.primary} type="submit" disabled={busy || !form.name.trim()}>{busy ? "Creating…" : "Create code"}</button>
          </form>
          <div className={`${shell.panel} ${shell.share}`} aria-live="polite">
            {created ? <>
              <p className={shell.eyebrow}>Ready to share</p>
              <h2>{createdShared ? `Shared code: ${created.recipient_name}` : `Code for ${created.recipient_name}`}</h2>
              <p><span className={styles.benefit} data-kind={created.benefit.kind}>{createdBenefit}</span> {createdAdmits ? "· admits new accounts" : "· existing accounts only"}{created.campaign ? ` · ${created.campaign}` : ""}</p>
              {createdNotes.map((note) => <p key={note} className={styles.warning}>{note}</p>)}
              {created.email ? <p className={shell.notice}>{created.email_queued ? `Email queued for ${created.email}. Keep the link below in case you need to share it yourself.` : `Email is not enabled on the server, so nothing was sent to ${created.email}. Send the message below yourself.`}</p> : null}
              <label htmlFor="share-link">{createdAdmits ? "Signup link with code" : "Redeem link with code"}</label><div className={shell.copyRow}><input id="share-link" value={primaryLink} readOnly /><button onClick={() => void copy(primaryLink, "Link")}>Copy link</button></div>
              {secondaryLink && <><label htmlFor="redeem-link">Redeem link for existing accounts</label><div className={shell.copyRow}><input id="redeem-link" value={secondaryLink} readOnly /><button onClick={() => void copy(secondaryLink, "Redeem link")}>Copy link</button></div></>}
              <label htmlFor="created-code">Code</label><div className={shell.copyRow}><input id="created-code" className={shell.code} value={created.code} readOnly /><button onClick={() => void copy(created.code, "Code")}>Copy code</button></div>
              <small>{created.max_uses === 1 ? "One use" : created.max_uses ? `${created.max_uses} uses` : "Unlimited uses"} · Expires {formatDateTime(created.expires_at)}</small>
              <button className={shell.primary} onClick={() => void copy(message, "Message")}>Copy message</button>
              <p className={shell.notice}>Copy the code before leaving or creating another. The full code is only shown now.</p>
              <p className={shell.feedback} role="status">{copyFeedback}</p>
            </> : <div className={shell.emptyShare}><span aria-hidden="true">↗</span><h2>Your code will appear here</h2><p>Create a code, copy the message, and send it.</p></div>}
          </div>
        </section>
        <section className={shell.history} aria-labelledby="history-heading">
          <div className={shell.historyHeading}><div><h2 id="history-heading">Codes</h2><p>{records.length} code{records.length === 1 ? "" : "s"} · {records.filter((item) => item.benefit.kind !== "none").length} with a benefit</p></div><button onClick={() => void refresh()} disabled={loading || busy}>{loading ? "Refreshing…" : "Refresh"}</button></div>
          {records.length > 0 && <input className={shell.search} aria-label="Search codes" placeholder="Search by name, email or campaign" value={search} onChange={(event) => setSearch(event.target.value)} />}
          {records.length === 0 ? <div className={shell.emptyHistory}><h3>No codes yet</h3><p>Your first code will appear here.</p></div> : <div className={shell.tableScroll}><table><thead><tr><th>Person or campaign</th><th>Benefit</th><th>Uses</th><th>Status</th><th>Signup email</th><th>Expires</th><th></th></tr></thead><tbody>
            {filtered.map((record) => <tr key={record.id}>
              <td><strong>{record.recipient_name}</strong><small>Code ending {record.code_hint || "—"}{record.campaign ? ` · ${record.campaign}` : ""}</small></td>
              <td><span className={styles.benefit} data-kind={record.benefit.kind}>{benefitLabel(record.benefit)}</span>{record.benefit.kind !== "none" && <small>{record.admits_signup ? "Admits new accounts" : "Existing accounts only"}</small>}</td>
              <td>{usesLabel(record)}</td>
              <td><span className={shell.status} data-status={record.status}>{record.max_uses !== 1 && record.status === "pending" ? "Active" : statusLabels[record.status] ?? record.status}</span></td>
              <td>{record.email || (record.max_uses !== 1 ? "many" : "—")}</td>
              <td>{formatDateTime(record.expires_at)}</td>
              <td>
                <button type="button" onClick={() => setDrawer(record)}>Redemptions</button>{" "}
                {record.status === "pending" ? <button type="button" onClick={() => void revoke(record)} disabled={Boolean(revoking)}>{revoking === record.id ? "Revoking…" : "Revoke"}</button> : null}
              </td>
            </tr>)}
            {filtered.length === 0 && <tr><td colSpan={7}>No codes match your search.</td></tr>}
          </tbody></table></div>}
          <p className={shell.notice}>Showing the latest 500 codes. Revoking a code stops further use; it does not take back what was already redeemed.</p>
        </section>
      </div>
      {drawer && <RedemptionsDrawer token={session.token} invitation={drawer} onClose={() => setDrawer(null)} onAccessError={handleAccessError} />}
    </main>
  );
}
