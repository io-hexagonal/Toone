import type { ReactNode } from "react";
import type { ClientKind, ConnectorMac, ConsentFailure, ConsentRequest } from "@/lib/connect/consent";
import styles from "./connect.module.css";

/*
 * What /connect shows, as a pure function of its state (ConnectPage owns the
 * state and the API calls). English only, like the privacy policy it links
 * to; plain words, no internal names.
 */

/** The privacy policy's section on connecting an assistant. */
export const PRIVACY_CONNECTOR_PATH = "/en/privacy#claude-connector";
/** The plain plans page: the only link the no-Pro state shows (no prices or checkout on this page). */
export const PLANS_PATH = "/en/pricing";

export type MacsView =
  | { status: "loading" }
  | { status: "hidden" }
  | { status: "list"; macs: ConnectorMac[] };

/** A failure that ends the page, with what can still be done. */
export type EndedReason =
  | "invalid-link"
  | "expired"
  | "unavailable"
  | "unreachable"
  | "rate-limited"
  | "page-error"
  | "bad-redirect";

export type ConsentState =
  | { kind: "checking" }
  | { kind: "loading" }
  | {
      kind: "request";
      request: ConsentRequest;
      email: string;
      macs: MacsView;
      /** The "start and control routines" option; only shown when the request asked for it. */
      allowAct: boolean;
      /** A decision is on its way: both buttons stay disabled. */
      busy: "allow" | "deny" | null;
      /** A failed decision that can be tried again. */
      notice: ConsentFailure | null;
    }
  | { kind: "leaving"; approve: boolean; clientKind: ClientKind }
  | { kind: "ended"; reason: EndedReason; clientKind: ClientKind | null };

export type ConsentHandlers = {
  onAllow?: () => void;
  onDeny?: () => void;
  onToggleAct?: (allow: boolean) => void;
  onSwitchAccount?: () => void;
  onRetry?: () => void;
};

/** Who the person goes back to. */
function backTo(kind: ClientKind | null): string {
  return kind === "claude" ? "Claude" : "the app you came from";
}

/** The subject of "… wants to use Toone" sentences after the first mention. */
function subject(kind: ClientKind): string {
  return kind === "claude" ? "Claude" : "This app";
}

export function consentTitle(kind: ClientKind): string {
  return kind === "claude" ? "Connect Claude to your Toone" : "Connect an app to your Toone";
}

const NOTICE: Record<ConsentFailure, string> = {
  "rate-limited": "Too many attempts in a short time. Wait a minute, then try again.",
  "page-error": "Something went wrong on this page. Reload it and try again.",
  unreachable: "Toone could not be reached. Check your connection and try again.",
  // The rest end the page or change its state; kept for completeness.
  "signed-out": "Your session ended. Sign in again to continue.",
  expired: "This link expired or was already used.",
  unavailable: "Connecting is not available right now.",
  "not-allowed": "Connecting is not available for this account yet.",
  "needs-pro": "Connecting an assistant needs Toone Pro. Your account doesn't have it.",
};

export function endedCopy(reason: EndedReason, kind: ClientKind | null): { title: string; body: string; retry: boolean } {
  const back = backTo(kind);
  const app = kind === "claude" ? "Claude" : kind ? "this app" : "an assistant";
  switch (reason) {
    case "invalid-link":
      return { title: "This link is incomplete", body: `Go back to ${back} and connect again.`, retry: false };
    case "expired":
      return { title: "This link has expired", body: `It expired or was already used. Go back to ${back} and connect again.`, retry: false };
    case "unavailable":
      return { title: "Not available right now", body: `Connecting ${app} to Toone is not available right now. Please try again later.`, retry: false };
    case "bad-redirect":
      return { title: "Connecting didn't finish", body: `Toone couldn't send you back safely. Go back to ${back} and connect again.`, retry: false };
    case "rate-limited":
      return { title: "Too many attempts", body: NOTICE["rate-limited"], retry: true };
    case "page-error":
      return { title: "Something went wrong", body: NOTICE["page-error"], retry: true };
    case "unreachable":
      return { title: "Toone couldn't be reached", body: NOTICE.unreachable, retry: true };
  }
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <a href="/en" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </a>
        </header>
        {children}
      </div>
    </main>
  );
}

/** "Claude (claude.ai) wants to use Toone on your Mac." The name a client gave itself never stands alone. */
export function WhoIsAsking({ request }: { request: ConsentRequest }) {
  const host = request.redirectHost || "an unknown address";
  if (request.clientKind === "claude") {
    return <p className={styles.lede}><strong>Claude</strong> ({host}) wants to use Toone on your Mac.</p>;
  }
  if (request.clientKind === "local") {
    return (
      <p className={styles.lede}>
        <strong>An app on this computer</strong>
        {request.clientName ? <> (calling itself &ldquo;{request.clientName}&rdquo;)</> : null} wants to use Toone on your Mac.
      </p>
    );
  }
  return (
    <>
      <p className={styles.lede}>
        <strong>{request.clientName ? <>&ldquo;{request.clientName}&rdquo;</> : "An app"}</strong> at <strong>{host}</strong> wants to use Toone on your Mac.
      </p>
      <p className={styles.warning} role="note">
        This is not Claude. Only allow it if you started this connection yourself and trust {host}.
      </p>
    </>
  );
}

function CheckIcon() {
  return (
    <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Abilities({ request, allowAct, disabled, onToggleAct }: {
  request: ConsentRequest; allowAct: boolean; disabled: boolean; onToggleAct?: (allow: boolean) => void;
}) {
  const who = subject(request.clientKind);
  return (
    <section className={styles.panel} aria-labelledby="connect-abilities">
      <h2 id="connect-abilities">What {who === "Claude" ? "Claude" : "it"} will be able to do</h2>
      <ul className={styles.abilities}>
        <li>
          <CheckIcon />
          <span>See your routines, runs, what is waiting for you, record books, and conversations in your Toone projects.</span>
        </li>
      </ul>
      {request.scopes.includes("act") && (
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={allowAct}
            disabled={disabled}
            onChange={(event) => onToggleAct?.(event.target.checked)}
          />
          <span>
            <strong>Start, pause, continue, cancel and answer routines.</strong>{" "}
            Toone still asks you on your Mac before each of these.
          </span>
        </label>
      )}
    </section>
  );
}

function Macs({ macs, kind }: { macs: MacsView; kind: ClientKind }) {
  if (macs.status === "hidden") return null;
  const who = subject(kind);
  let body: ReactNode;
  if (macs.status === "loading") {
    body = <p role="status">Looking for your Mac…</p>;
  } else if (macs.macs.length === 0) {
    body = (
      <>
        <p>Toone isn&apos;t open on any of your Macs right now.</p>
        <p className={styles.strong}>Open Toone on your Mac and sign in.</p>
        <p>You can allow this now; {who === "Claude" ? "Claude" : "the app"} reaches your Mac once Toone is open.</p>
      </>
    );
  } else if (macs.macs.length === 1) {
    body = <p>{who} will reach <strong className={styles.macName}>{macs.macs[0].name}</strong>, where Toone is open now.</p>;
  } else {
    body = (
      <>
        <p>
          Toone is open on {macs.macs.length} of your Macs. {who} uses the one you used most recently, unless you
          name another one when you ask.
        </p>
        <ul className={styles.macList}>
          {macs.macs.map((mac, index) => (
            <li key={mac.id}>
              <span className={styles.macName}>{mac.name}</span>
              {index === 0 && <span className={styles.tag}>Most recent</span>}
            </li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <section className={styles.panel} aria-labelledby="connect-macs">
      <h2 id="connect-macs">{macs.status === "list" && macs.macs.length > 1 ? "Your Macs" : "Your Mac"}</h2>
      {body}
    </section>
  );
}

function HowItWorks({ kind }: { kind: ClientKind }) {
  const requests = kind === "claude" ? "Claude's requests" : "Its requests";
  return (
    <section className={styles.panel} aria-labelledby="connect-how">
      <h2 id="connect-how">How it works</h2>
      <p>
        {requests} go to Toone&apos;s servers and on to the Toone app on your Mac, which must be open. Toone passes
        them on without storing their content, and keeps a record of which tools were used for 30 days. You can
        disconnect at any time in your Toone account or app.
      </p>
      <p><a href={PRIVACY_CONNECTOR_PATH}>How Toone handles your data</a></p>
    </section>
  );
}

function Ineligible({ request }: { request: ConsentRequest }) {
  if (request.ineligibleReason === "subscription_required") {
    return (
      <section className={styles.panel} aria-labelledby="connect-pro">
        <h2 id="connect-pro">Toone Pro</h2>
        <p className={styles.strong}>Connecting an assistant needs Toone Pro. Your account doesn&apos;t have it.</p>
        <p><a href={PLANS_PATH}>About Toone plans</a></p>
      </section>
    );
  }
  return (
    <section className={styles.panel} aria-labelledby="connect-not-yet">
      <h2 id="connect-not-yet">Not available yet</h2>
      <p className={styles.strong}>Connecting {request.clientKind === "claude" ? "Claude" : "an app"} is not available for this account yet.</p>
    </section>
  );
}

/** The page for every state. */
export default function ConsentScreen({ state, ...on }: { state: ConsentState } & ConsentHandlers) {
  if (state.kind === "checking" || state.kind === "loading") {
    return (
      <Shell>
        <div className={styles.centered}>
          <p role="status">{state.kind === "checking" ? "Checking your account…" : "Loading the request…"}</p>
        </div>
      </Shell>
    );
  }

  if (state.kind === "leaving") {
    return (
      <Shell>
        <div className={styles.centered}>
          <h1>{state.approve ? "Connected" : "Not allowed"}</h1>
          <p role="status">Taking you back to {backTo(state.clientKind)}…</p>
        </div>
      </Shell>
    );
  }

  if (state.kind === "ended") {
    const copy = endedCopy(state.reason, state.clientKind);
    return (
      <Shell>
        <div className={styles.centered}>
          <h1>{copy.title}</h1>
          <p role="alert">{copy.body}</p>
          {copy.retry && on.onRetry && (
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={on.onRetry}>Try again</button>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  const { request, email, busy, notice } = state;
  const disabled = busy !== null;
  return (
    <Shell>
      <h1>{consentTitle(request.clientKind)}</h1>
      <WhoIsAsking request={request} />
      <p className={styles.account}>
        Signed in as <strong>{email}</strong>.{" "}
        <button type="button" className={styles.linkButton} onClick={on.onSwitchAccount} disabled={disabled}>
          Not you? Switch account
        </button>
      </p>

      <div className={styles.stack}>
        {request.eligible ? (
          <>
            <Abilities request={request} allowAct={state.allowAct} disabled={disabled} onToggleAct={on.onToggleAct} />
            <Macs macs={state.macs} kind={request.clientKind} />
            <HowItWorks kind={request.clientKind} />
          </>
        ) : (
          <Ineligible request={request} />
        )}
      </div>

      {notice && <p className={styles.error} role="alert">{NOTICE[notice]}</p>}

      <div className={styles.decision}>
        {request.eligible && (
          <button type="button" className={styles.primary} onClick={on.onAllow} disabled={disabled} aria-busy={busy === "allow"}>
            {busy === "allow" ? "Allowing…" : "Allow"}
          </button>
        )}
        <button type="button" onClick={on.onDeny} disabled={disabled} aria-busy={busy === "deny"}>
          {busy === "deny" ? "Sending…" : "Don't allow"}
        </button>
      </div>
    </Shell>
  );
}
