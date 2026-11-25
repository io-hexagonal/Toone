import type { ReactNode } from "react";
import { assistantName, type AccessMode, type ClientKind, type CodePending, type ConnectorMac, type ConsentFailure, type ConsentRequest } from "@/lib/connect/consent";
import styles from "./connect.module.css";

/*
 * What /connect shows, as a pure function of its state (ConnectPage owns the
 * state and the API calls). English only, like the privacy policy it links
 * to; plain words, no internal names.
 */

/** The privacy policy's section on connecting an assistant. */
export const PRIVACY_CONNECTOR_PATH = "/en/privacy#claude-connector";
/** The account's connected apps, with Disconnect (also linked from the new-connection email). */
export const CONNECTIONS_PATH = "/en/connections";

export type MacsView =
  | { status: "loading" }
  | { status: "hidden" }
  /** The Macs reachable now, explained (no choice to make); `account`: the registered ones, to say why none is reachable. */
  | { status: "list"; macs: ConnectorMac[]; account?: ConnectorMac[] }
  /** The API takes a chosen Mac: the account's active Macs, and which of them are open now. */
  | { status: "choice"; macs: ConnectorMac[]; open: string[] };

/** A failure that ends the page, with what can still be done. */
export type EndedReason =
  | "invalid-link"
  | "expired"
  | "unavailable"
  | "unreachable"
  | "rate-limited"
  | "page-error"
  | "bad-redirect"
  /** The request was started in another browser (or the link was forwarded). */
  | "other-browser"
  /** This tab already answered it (the Back button after a decision). */
  | "already-allowed"
  | "already-denied";

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
      /** The Mac the person picked; null is "the Mac I used last" (nothing sent). */
      macId: string | null;
      /** Allow works only after the page has had the person's attention for a moment (M2). */
      armed: boolean;
      /** How actions run, when the API offers the choice (`request.accessModes`). */
      accessMode: AccessMode;
      /** A decision is on its way: both buttons stay disabled. */
      busy: "allow" | "deny" | null;
      /** A failed decision that can be tried again. */
      notice: ConsentFailure | null;
    }
  /** Allow was pressed: the connection waits for the code emailed to the account. */
  | {
      kind: "code";
      request: ConsentRequest;
      email: string;
      pending: CodePending;
      /** What the person typed (digits only). */
      code: string;
      busy: "verify" | "resend" | "deny" | null;
      notice: string | null;
    }
  | { kind: "leaving"; approve: boolean; clientKind: ClientKind; tooManyCodes?: boolean }
  | { kind: "ended"; reason: EndedReason; clientKind: ClientKind | null };

export type ConsentHandlers = {
  /** `fromPointer` is false when Allow was pressed with the keyboard. */
  onAllow?: (fromPointer: boolean) => void;
  onDeny?: () => void;
  onToggleAct?: (allow: boolean) => void;
  onPickAccessMode?: (mode: AccessMode) => void;
  onPickMac?: (macId: string | null) => void;
  onSwitchAccount?: () => void;
  onRetry?: () => void;
  onCodeChange?: (code: string) => void;
  onConfirmCode?: () => void;
  onResendCode?: () => void;
  onDenyCode?: () => void;
};

/** Who the person goes back to. */
function backTo(kind: ClientKind | null): string {
  return assistantName(kind) ?? "the app you came from";
}

/** The subject of "… wants to use Toone" sentences after the first mention. */
function subject(kind: ClientKind): string {
  return assistantName(kind) ?? "This app";
}

export function consentTitle(kind: ClientKind): string {
  return `Connect ${assistantName(kind) ?? "an app"} to your Toone`;
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
  "other-browser": "This sign-in was started in another browser.",
};

/** The Mac picked for this connection is gone (removed, or not this account's): choose again. */
export const MAC_GONE_NOTICE = "That Mac is no longer available. Choose again.";

export function endedCopy(reason: EndedReason, kind: ClientKind | null): { title: string; body: string; retry: boolean } {
  const back = backTo(kind);
  const app = assistantName(kind) ?? (kind ? "this app" : "an assistant");
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
      return { title: "Too many attempts", body: "Wait a minute, then try again.", retry: true };
    case "page-error":
      return { title: "Something went wrong", body: "Something on this page didn't work. Try again.", retry: true };
    case "unreachable":
      return { title: "Toone couldn't be reached", body: "Check your connection and try again.", retry: true };
    case "other-browser":
      return { title: "Started in another browser", body: `This sign-in was started in another browser. Go back to ${back} and connect again from this browser.`, retry: false };
    case "already-allowed":
      return { title: "This connection is already set up", body: `You already allowed it. You can go back to ${back}.`, retry: false };
    case "already-denied":
      return { title: "You already answered", body: `You chose not to allow this connection. To connect, go back to ${back} and start again.`, retry: false };
  }
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          {/* Not a link: nothing on this page leads off into the site (plans, pricing) mid-flow. */}
          <span className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </span>
        </header>
        {children}
      </div>
    </main>
  );
}

/** "Claude (claude.ai) wants to use Toone on your Mac." The name a client gave itself never stands alone. */
export function WhoIsAsking({ request }: { request: ConsentRequest }) {
  const host = request.redirectHost || "an unknown address";
  const assistant = assistantName(request.clientKind);
  if (assistant) {
    return <p className={styles.lede}><strong>{assistant}</strong> ({host}) wants to use Toone on your Mac.</p>;
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

/** The access-mode choice (owner decision A): Auto first and recommended, the stricter "ask" second. */
const ACCESS_MODES: { mode: AccessMode; label: ReactNode }[] = [
  { mode: "auto", label: <><strong>Auto (recommended):</strong> run what you ask without asking again on your Mac</> },
  { mode: "ask", label: <>Ask me on my Mac each time</> },
];

function Abilities({ request, allowAct, accessMode, disabled, onToggleAct, onPickAccessMode }: {
  request: ConsentRequest; allowAct: boolean; accessMode: AccessMode; disabled: boolean;
  onToggleAct?: (allow: boolean) => void; onPickAccessMode?: (mode: AccessMode) => void;
}) {
  const offered = ACCESS_MODES.filter(({ mode }) => request.accessModes.includes(mode));
  const choosing = offered.length > 1;
  return (
    <section className={styles.panel} aria-labelledby="connect-abilities">
      <h2 id="connect-abilities">What {assistantName(request.clientKind) ?? "it"} will be able to do</h2>
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
            <strong>Start, pause, continue, cancel and answer routines, draft new routines and install shared ones from Explore.</strong>
            {/* With a mode to choose, the choice below says whether the Mac asks. */}
            {!choosing && <>{" "}Toone still asks you on your Mac before each of these.</>}
          </span>
        </label>
      )}
      {request.scopes.includes("act") && allowAct && choosing && (
        <div className={styles.modes}>
          <p id="connect-access-mode">When it acts:</p>
          <div className={styles.modePicker} role="radiogroup" aria-labelledby="connect-access-mode">
            {offered.map(({ mode, label }) => (
              <label key={mode} className={styles.modeOption}>
                <input type="radio" name="connect-access-mode" value={mode} checked={accessMode === mode} disabled={disabled}
                  onChange={() => onPickAccessMode?.(mode)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className={styles.quiet}>
            Your Mac&apos;s own setting still applies, and the stricter one wins. You can change this in Toone → Settings → Connected Apps.
          </p>
        </div>
      )}
    </section>
  );
}

/** Why a Mac cannot take assistants yet, or null. */
export function macAssistantsNote(mac: ConnectorMac): string | null {
  if (mac.assistants === "off") return "Assistants are off on this Mac: turn on Claude and other assistants (online) in Toone → Settings → Connected Apps.";
  if (mac.assistants === "update") return "Update Toone on this Mac to use assistants.";
  return null;
}

function Macs({ macs, kind, picked, disabled, onPickMac }: {
  macs: MacsView; kind: ClientKind; picked: string | null; disabled: boolean; onPickMac?: (macId: string | null) => void;
}) {
  if (macs.status === "hidden") return null;
  const who = subject(kind);
  const assistant = assistantName(kind);
  let body: ReactNode;
  if (macs.status === "loading") {
    body = <p role="status">Looking for your Mac…</p>;
  } else if (macs.status === "choice") {
    // consent-page.md §4: each Mac by name, then "The Mac I used last" (the default, which sends nothing).
    const open = new Set(macs.open);
    body = (
      <>
        <p id="connect-mac-choice">Reach Toone on:</p>
        <div className={styles.macPicker} role="radiogroup" aria-labelledby="connect-mac-choice">
          {macs.macs.map((mac) => {
            const note = macAssistantsNote(mac);
            return (
              <label key={mac.id} className={styles.macOption}>
                <input type="radio" name="connect-mac" value={mac.id} checked={picked === mac.id} disabled={disabled}
                  onChange={() => onPickMac?.(mac.id)} />
                <span className={styles.macText}>
                  <span className={styles.macName}>{mac.name}</span>
                  {note && <span className={styles.macNote}>{note}</span>}
                </span>
                {open.has(mac.id) && <span className={styles.tag}>Open now</span>}
              </label>
            );
          })}
          <label className={styles.macOption}>
            <input type="radio" name="connect-mac" value="" checked={picked === null} disabled={disabled}
              onChange={() => onPickMac?.(null)} />
            <span className={styles.macText}><span className={styles.macName}>The Mac I used last</span></span>
          </label>
        </div>
        {/* consent-page.md §3.2: a chosen Mac is the only one reached (refused while it is away); "last" falls back. */}
        <p className={styles.quiet}>
          {pickedName(macs.macs, picked)
            ? <>{who} will reach <strong className={styles.macName}>{pickedName(macs.macs, picked)}</strong> only.</>
            : <>{who} will reach the Mac you used last.</>}
        </p>
        {macs.open.length === 0 && !macs.macs.some(macAssistantsNote) && (
          <p>Toone isn&apos;t open on any of your Macs right now. Open Toone on your Mac and sign in.</p>
        )}
      </>
    );
  } else if (macs.macs.length === 0) {
    // None reachable: say why when a registered Mac tells us (its switch is off, or its Toone is too old).
    const blocked = (macs.account ?? []).filter((mac) => macAssistantsNote(mac));
    body = blocked.length > 0 ? (
      <>
        <ul className={styles.macNotes}>
          {blocked.map((mac) => (
            <li key={mac.id}><strong className={styles.macName}>{mac.name}</strong>: {macAssistantsNote(mac)}</li>
          ))}
        </ul>
        <p>You can allow this now; {assistant ?? "the app"} reaches your Mac once that is done.</p>
      </>
    ) : (
      <>
        <p>Toone isn&apos;t open on any of your Macs right now.</p>
        <p className={styles.strong}>Open Toone on your Mac and sign in.</p>
        <p>You can allow this now; {assistant ?? "the app"} reaches your Mac once Toone is open.</p>
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
  const several = (macs.status === "list" || macs.status === "choice") && macs.macs.length > 1;
  return (
    <section className={styles.panel} aria-labelledby="connect-macs">
      <h2 id="connect-macs">{several ? "Your Macs" : "Your Mac"}</h2>
      {body}
    </section>
  );
}

function pickedName(macs: ConnectorMac[], picked: string | null): string | null {
  return picked ? macs.find((mac) => mac.id === picked)?.name ?? null : null;
}

/** M1: who should be allowing this, in one line above the buttons. */
function onlyIf(kind: ClientKind): string {
  const assistant = assistantName(kind);
  if (assistant) return `Only allow this if you just clicked Connect in ${assistant} in this browser.`;
  if (kind === "local") return "Only allow this if you just started connecting from an app on this computer.";
  return "Only allow this if you just started this connection yourself, in this browser.";
}

function HowItWorks({ kind }: { kind: ClientKind }) {
  const assistant = assistantName(kind);
  const requests = assistant ? `${assistant}'s requests` : "Its requests";
  return (
    <section className={styles.panel} aria-labelledby="connect-how">
      <h2 id="connect-how">How it works</h2>
      <p>
        {requests} go to Toone&apos;s servers and on to the Toone app on your Mac, which must be open. Toone passes
        them on without storing their content, and keeps a record of which tools were used for 30 days. You can
        disconnect at any time in the Toone app (Settings › Connected Apps) or on <a href={CONNECTIONS_PATH}>your connected apps page</a>.
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
      </section>
    );
  }
  return (
    <section className={styles.panel} aria-labelledby="connect-not-yet">
      <h2 id="connect-not-yet">Not available yet</h2>
      <p className={styles.strong}>Connecting {assistantName(request.clientKind) ?? "an app"} is not available for this account yet.</p>
    </section>
  );
}

/** The page for every state. */
export default function ConsentScreen({ state, macNotice = null, ...on }: {
  state: ConsentState;
  /** Shown instead of the decision notice when the picked Mac was refused. */
  macNotice?: string | null;
} & ConsentHandlers) {
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
          <h1>{state.approve ? "Allowed" : "Not allowed"}</h1>
          {state.tooManyCodes && <p role="alert">Too many wrong codes. This connection was cancelled.</p>}
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

  if (state.kind === "code") return <CodeEntry state={state} on={on} />;

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
            <Abilities request={request} allowAct={state.allowAct} accessMode={state.accessMode} disabled={disabled}
              onToggleAct={on.onToggleAct} onPickAccessMode={on.onPickAccessMode} />
            <Macs macs={state.macs} kind={request.clientKind} picked={state.macId}
              disabled={disabled} onPickMac={on.onPickMac} />
            <HowItWorks kind={request.clientKind} />
          </>
        ) : (
          <Ineligible request={request} />
        )}
      </div>

      {(macNotice || notice) && <p className={styles.error} role="alert">{macNotice ?? NOTICE[notice!]}</p>}

      {request.eligible && <p className={styles.onlyIf}>{onlyIf(request.clientKind)}</p>}

      <div className={styles.decision}>
        {request.eligible && (
          <button type="button" className={styles.primary} disabled={disabled || !state.armed} aria-busy={busy === "allow"}
            onClick={(event) => on.onAllow?.(event.detail > 0)}>
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

/**
 * The emailed code that confirms Allow. Someone who could press Allow in the
 * person's name (a script on the page, or a session left open) cannot read
 * their email, so a new connection needs both.
 */
function CodeEntry({ state, on }: { state: Extract<ConsentState, { kind: "code" }>; on: ConsentHandlers }) {
  const { request, email, pending, code, busy, notice } = state;
  const disabled = busy !== null;
  const assistant = assistantName(request.clientKind) ?? "this app";
  const where = pending.emailHint || email;
  return (
    <Shell>
      <h1>Check your email</h1>
      <p className={styles.lede}>
        We sent a 6-digit code to <strong>{where}</strong>. Enter it to finish connecting {assistant} to your Toone.
      </p>
      <form
        className={styles.stack}
        onSubmit={(event) => { event.preventDefault(); on.onConfirmCode?.(); }}
      >
        <section className={styles.panel} aria-labelledby="connect-code">
          <h2 id="connect-code"><label htmlFor="connect-code-input">Code from the email</label></h2>
          <input
            id="connect-code-input"
            className={styles.codeInput}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            value={code}
            disabled={disabled}
            onChange={(event) => on.onCodeChange?.(event.target.value)}
            aria-describedby="connect-code-help"
          />
          <p id="connect-code-help" className={styles.quiet}>
            The code works for 10 minutes. If you didn&apos;t start connecting {assistant}, choose Don&apos;t allow.
          </p>
        </section>
        {notice && <p className={styles.error} role="alert">{notice}</p>}
        <div className={styles.decision}>
          <button type="submit" className={styles.primary} disabled={disabled || code.length !== 6} aria-busy={busy === "verify"}>
            {busy === "verify" ? "Checking…" : "Confirm"}
          </button>
          <button type="button" onClick={on.onDenyCode} disabled={disabled} aria-busy={busy === "deny"}>
            {busy === "deny" ? "Sending…" : "Don't allow"}
          </button>
        </div>
      </form>
      <p className={styles.account}>
        {pending.resendsLeft > 0 ? (
          <>
            No email? Check your spam folder, or{" "}
            <button type="button" className={styles.linkButton} onClick={on.onResendCode} disabled={disabled} aria-busy={busy === "resend"}>
              {busy === "resend" ? "sending a new code…" : "send a new code"}
            </button>.
          </>
        ) : (
          <>No email? Check your spam folder. No more codes can be sent for this connection.</>
        )}
      </p>
    </Shell>
  );
}
