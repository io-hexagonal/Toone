"use client";

import { useCallback, useEffect, useState } from "react";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { logout, type ToneSession } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { accessOutcome } from "@/components/admin/access";
import { discountText, formatMoney, myAffiliate, type Affiliate } from "@/lib/affiliates";
import styles from "@/components/account/account.module.css";
import CreatorIdeas from "./CreatorIdeas";

type State = { kind: "loading" } | { kind: "ready"; affiliate: Affiliate } | { kind: "none" } | { kind: "failed" };

/** /creators: the signed-in creator's link, code and sales. English only. */
export default function CreatorDashboard() {
  const { session, ready, setSession, endSession } = useStoredSession();
  if (!ready) return <main className={`${styles.page} ${styles.centered}`}><p role="status">Checking your account…</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  return <Dashboard key={session.token} session={session} onSessionEnded={endSession} />;
}

function Dashboard({ session, onSessionEnded }: { session: ToneSession; onSessionEnded: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const affiliate = await myAffiliate(session.token);
      setState(affiliate ? { kind: "ready", affiliate } : { kind: "none" });
    } catch (caught) {
      if (accessOutcome(caught) === "session") onSessionEnded();
      else setState({ kind: "failed" });
    }
  }, [session.token, onSessionEnded]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { document.title = "Creator dashboard | Toone"; }, []);

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setFeedback(`${label} copied.`); }
    catch { setFeedback("Copy was unavailable. Select and copy it instead."); }
  }

  async function signOut() {
    await logout(session.token);
    onSessionEnded();
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
          <div className={styles.who}><span>{session.user.email}</span><button type="button" onClick={() => void signOut()}>Sign out</button></div>
        </header>
        {state.kind === "loading" && <div className={styles.title}><p role="status" className={styles.sub}>Loading your dashboard…</p></div>}
        {state.kind === "failed" && <div className={styles.title}>
          <h1>Creator dashboard</h1>
          <p role="alert" className={styles.error}>Could not load your dashboard.</p>
          <div className={styles.actions}><button type="button" onClick={() => void load()}>Try again</button></div>
        </div>}
        {state.kind === "none" && <div className={styles.title}>
          <h1>Creator dashboard</h1>
          <p className={styles.sub}>This account is not a Toone creator yet. If you received a creator link, open it and join with this account. Questions: <Link href="/contact">contact us</Link>.</p>
        </div>}
        {state.kind === "ready" && <CreatorView affiliate={state.affiliate} onCopy={copy} feedback={feedback} />}
      </div>
    </main>
  );
}

function CreatorView({ affiliate, onCopy, feedback }: { affiliate: Affiliate; onCopy: (value: string, label: string) => void; feedback: string }) {
  const totals = affiliate.sales;
  return <>
    <div className={styles.title}>
      <p className={styles.eyebrow}>Toone creator</p>
      <h1>{affiliate.name}</h1>
      <p className={styles.sub}>{affiliate.status === "paused" ? "Your link is paused. Get in touch to turn it back on." : "Share your link. Your audience gets the discount, and you get your share of what it sells."}</p>
    </div>
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Your link</h2>
        <div className={styles.inline}><input value={affiliate.link} readOnly aria-label="Your link" /><button type="button" onClick={() => onCopy(affiliate.link, "Link")}>Copy</button></div>
        <p>Or tell people to use the code <span className={styles.code}>{affiliate.promotion_code}</span> at checkout. <button type="button" className={styles.linkButton} onClick={() => onCopy(affiliate.promotion_code, "Code")}>Copy code</button></p>
        <ul className={styles.facts}>
          <li>Your audience gets: {affiliate.discount_text || discountText(affiliate.discount)}</li>
          <li>Your share: {affiliate.commission_percent}% of what buyers pay</li>
          <li>Visits to your link: {affiliate.visits}</li>
        </ul>
        <p className={styles.ok} role="status">{feedback}</p>
      </section>
      <section className={styles.panel}>
        <h2>Sales</h2>
        {totals.length === 0 ? <p>No sales yet. Sales appear here once someone buys Toone Pro with your link or code.</p> : (
          <dl className={styles.summary}>
            {totals.map((row) => <div key={row.currency}>
              <dt>{row.currency.toUpperCase()}</dt>
              <dd>{row.sales} sale{row.sales === 1 ? "" : "s"} · {formatMoney(row.revenue, row.currency)} paid by buyers{row.refunded ? ` · ${row.refunded} refunded` : ""}</dd>
              <dd>Your share: {formatMoney(row.commission, row.currency)}, of which {formatMoney(row.payable_commission, row.currency)} is ready to pay</dd>
            </div>)}
          </dl>
        )}
        <p className={styles.notice}>A sale&apos;s share is ready to pay 30 days after the purchase, once the refund window has passed. Shares are paid monthly by bank transfer.</p>
      </section>
    </div>
    <CreatorIdeas heading="Ideas for your next video" />
    <nav className={styles.footerLinks} aria-label="More">
      <Link href="/account">Your account</Link>
      <Link href="/pricing">Plans</Link>
    </nav>
  </>;
}
