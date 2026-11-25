"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthPage from "@/components/AuthPage";
import { logout, type ToneSession } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { ApiError } from "@/lib/api";
import {
  cleanCode,
  confirmWithCode,
  consentFailure,
  decide,
  resendConsentCode,
  getConsentRequest,
  listAccountMacs,
  listConnectorMacs,
  expiryTimerMs,
  recallAnswer,
  rememberAnswer,
  type ClientKind,
  type ConsentFailure,
  type CodePending,
  type ConsentRequest,
} from "@/lib/connect/consent";
import { browserAttentionEnv, watchAttention, type AttentionGate } from "@/lib/connect/attention";
import ConsentScreen, { MAC_GONE_NOTICE, type ConsentState, type EndedReason, type MacsView } from "./ConsentScreen";

/**
 * /connect?request=car_…: sign in if needed (on this page, so the request
 * stays in the address), then read the request, show it and post the
 * decision once. The request id is never sent to analytics (the site loads
 * none on this page) and the address the API answers is never shown.
 */
export default function ConnectPage({ requestId }: { requestId: string | null }) {
  const { session, ready, setSession, endSession } = useStoredSession();
  const [sessionEnded, setSessionEnded] = useState(false);

  if (!requestId) return <ConsentScreen state={{ kind: "ended", reason: "invalid-link", clientKind: null }} />;
  if (!ready) return <ConsentScreen state={{ kind: "checking" }} />;
  if (!session) {
    return (
      <ConnectSignIn
        sessionEnded={sessionEnded}
        onAuthenticated={(next) => { setSessionEnded(false); setSession(next); }}
      />
    );
  }
  return (
    <ConsentFlow
      key={session.token}
      session={session}
      requestId={requestId}
      onSessionLost={() => { setSessionEnded(true); endSession(); }}
      onSwitchAccount={async () => { await logout(session.token); setSessionEnded(false); endSession(); }}
    />
  );
}

/** Signed out: the site's sign-in (email and password, Apple, Google), titled for this page. */
export function ConnectSignIn({ sessionEnded, onAuthenticated }: {
  sessionEnded: boolean;
  onAuthenticated: (session: ToneSession) => void;
}) {
  return (
    <AuthPage
      mode="signin"
      contained
      onAuthenticated={onAuthenticated}
      heading={{
        title: "Sign in to connect",
        sub: sessionEnded
          ? "Your session ended. Sign in again to finish connecting."
          : "Sign in to Toone to finish connecting. You'll see what is being connected before anything happens.",
      }}
    />
  );
}

/** Failures that end the page when reading the request. */
const ENDS_ON_LOAD: Partial<Record<ConsentFailure, EndedReason>> = {
  expired: "expired",
  unavailable: "unavailable",
  "other-browser": "other-browser",
  "rate-limited": "rate-limited",
  "page-error": "page-error",
  unreachable: "unreachable",
};

function ConsentFlow({ session, requestId, onSessionLost, onSwitchAccount }: {
  session: ToneSession;
  requestId: string;
  onSessionLost: () => void;
  onSwitchAccount: () => Promise<void>;
}) {
  const [state, setState] = useState<ConsentState>({ kind: "loading" });
  /** Set once the API has taken a decision: the buttons never come back. */
  const decided = useRef(false);
  const alive = useRef(true);
  // Set on every mount: development runs effects twice (mount, unmount, mount).
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  // The parent's callbacks change on every render; reading them through a ref keeps `load` stable.
  const sessionLost = useRef(onSessionLost);
  sessionLost.current = onSessionLost;

  const { token } = session;
  const email = session.user.email;
  const [macNotice, setMacNotice] = useState<string | null>(null);

  // Allow arms after a moment of the person's attention, and disarms when the page loses it (M2).
  const [armed, setArmed] = useState(false);
  const gate = useRef<AttentionGate | null>(null);
  useEffect(() => {
    const watcher = watchAttention(browserAttentionEnv(), setArmed);
    gate.current = watcher;
    return () => { watcher.stop(); gate.current = null; };
  }, []);

  // Back after a decision: a page restored from the back-forward cache says it was already answered.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      const answer = recallAnswer(requestId);
      if (event.persisted && answer) setState({ kind: "ended", reason: answer === "allowed" ? "already-allowed" : "already-denied", clientKind: null });
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [requestId]);

  /**
   * Which Macs to show: a picker when the API takes a choice and the account
   * has several, else who is open now. The account's Macs also say why none
   * is reachable (assistants switched off, or a Toone too old). Both lists
   * are a help, not a condition: a failure hides what it would have shown.
   */
  const loadMacs = useCallback(async (request: ConsentRequest): Promise<MacsView> => {
    const [open, account] = await Promise.all([
      listConnectorMacs(token).catch(() => null),
      listAccountMacs(token).catch(() => null),
    ]);
    if (request.macChoice && account && account.length > 1) {
      return { status: "choice", macs: account, open: (open ?? []).map((mac) => mac.id) };
    }
    return open ? { status: "list", macs: open, account: account ?? [] } : { status: "hidden" };
  }, [token]);

  const load = useCallback(async () => {
    setMacNotice(null);
    // This tab already answered (Back after Allow): say so rather than "expired".
    const answer = recallAnswer(requestId);
    if (answer) {
      decided.current = true;
      setState({ kind: "ended", reason: answer === "allowed" ? "already-allowed" : "already-denied", clientKind: null });
      return;
    }
    setState({ kind: "loading" });
    let kind: ClientKind | null = null;
    try {
      const request = await getConsentRequest(token, requestId);
      kind = request.clientKind;
      if (!alive.current) return;
      // Allow was already pressed (the page was reloaded): go straight to the emailed code.
      if (request.codePending) {
        setState(codeState(request, email, request.codePending, null));
        return;
      }
      setState({
        kind: "request", request, email,
        macs: request.eligible ? { status: "loading" } : { status: "hidden" },
        allowAct: request.scopes.includes("act"), macId: null, armed: false, busy: null, notice: null,
        // Owner decision A: Auto is recommended and chosen by default when the API offers it.
        accessMode: request.accessModes.includes("auto") ? "auto" : "ask",
      });
      if (!request.eligible) return;
      const macs = await loadMacs(request);
      if (alive.current) setState((current) => (current.kind === "request" ? { ...current, macs } : current));
    } catch (error) {
      if (!alive.current) return;
      const failure = consentFailure(error);
      if (failure === "signed-out") return sessionLost.current();
      setState({ kind: "ended", reason: ENDS_ON_LOAD[failure] ?? "unreachable", clientKind: kind });
    }
  }, [token, email, requestId, loadMacs]);

  useEffect(() => { void load(); }, [load]);

  // The request lapses after five minutes, or when its emailed code does:
  // say so instead of letting Allow or the code fail.
  const expiresAt = state.kind === "request" ? state.request.expiresAt : state.kind === "code" ? state.pending.codeExpiresAt : null;
  const clientKind = state.kind === "request" || state.kind === "code" ? state.request.clientKind : null;
  useEffect(() => {
    if (expiresAt === null) return;
    const left = expiryTimerMs({ expiresAt }, Date.now(), state.kind === "code" ? CODE_LIFETIME_MS : undefined);
    if (left === null) return;
    const timer = window.setTimeout(() => {
      if (decided.current) return;
      setState((current) => ((current.kind === "request" || current.kind === "code") && current.busy === null
        ? { kind: "ended", reason: "expired", clientKind }
        : current));
    }, left);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the timer follows the deadline, not every state change
  }, [expiresAt, clientKind]);

  async function submit(approve: boolean, fromPointer = true) {
    if (state.kind !== "request" || state.busy !== null || decided.current) return;
    // A press that began before Allow armed (or while the page was away) does not count.
    if (approve && !gate.current?.accepts(fromPointer)) return;
    const { request, allowAct, macId, accessMode } = state;
    setMacNotice(null);
    setState({ ...state, busy: approve ? "allow" : "deny", notice: null });
    const outcome = await decide(token, request, approve, { allowAct, macId, accessMode });
    if (!alive.current) return;
    const kind = request.clientKind;
    if (outcome.kind === "code") {
      setState(codeState(request, email, outcome.pending, null));
      return;
    }
    if (outcome.kind === "navigate") {
      decided.current = true;
      rememberAnswer(request.id, approve);
      setState({ kind: "leaving", approve, clientKind: kind });
      // Top-level navigation, same tab: the address carries a one-time code.
      window.location.assign(outcome.url);
      return;
    }
    if (outcome.kind === "bad-redirect") {
      decided.current = true;
      setState({ kind: "ended", reason: "bad-redirect", clientKind: kind });
      return;
    }
    switch (outcome.failure) {
      case "signed-out":
        return sessionLost.current();
      case "expired":
      case "unavailable":
      case "other-browser":
        decided.current = outcome.failure !== "unavailable";
        setState({ kind: "ended", reason: outcome.failure, clientKind: kind });
        return;
      case "needs-pro":
      case "not-allowed":
        // The request stays pending: explain, keep "Don't allow".
        setState({
          kind: "request", request: { ...request, eligible: false,
            ineligibleReason: outcome.failure === "needs-pro" ? "subscription_required" : "not_allowed" },
          email, macs: { status: "hidden" }, allowAct, macId, accessMode, armed: false, busy: null, notice: null,
        });
        return;
      case "page-error":
        if (macId) {
          // consent-page.md §3.2: a Mac that is no longer this account's is refused; reload the list and ask again.
          setMacNotice(MAC_GONE_NOTICE);
          const macs = await loadMacs(request);
          if (alive.current) setState((current) => (current.kind === "request" ? { ...current, macs, macId: null, busy: null } : current));
          return;
        }
        setState((current) => (current.kind === "request" ? { ...current, busy: null, notice: outcome.failure } : current));
        return;
      default:
        setState((current) => (current.kind === "request" ? { ...current, busy: null, notice: outcome.failure } : current));
    }
  }

  /** The emailed code: approve with it, or come back with `error` after too many wrong ones. */
  async function confirmCode() {
    if (state.kind !== "code" || state.busy !== null || decided.current) return;
    const { request } = state;
    setState({ ...state, busy: "verify", notice: null });
    const outcome = await confirmWithCode(token, request, state.code);
    if (!alive.current) return;
    const kind = request.clientKind;
    switch (outcome.kind) {
      case "navigate":
        decided.current = true;
        rememberAnswer(request.id, outcome.approve);
        setState({ kind: "leaving", approve: outcome.approve, clientKind: kind, tooManyCodes: !outcome.approve });
        window.location.assign(outcome.url);
        return;
      case "bad-redirect":
        decided.current = true;
        setState({ kind: "ended", reason: "bad-redirect", clientKind: kind });
        return;
      case "wrong":
        setState((current) => current.kind === "code"
          ? { ...current, busy: null, code: "", pending: { ...current.pending, attemptsLeft: outcome.attemptsLeft }, notice: wrongCodeNotice(outcome.attemptsLeft) }
          : current);
        return;
      case "incomplete":
        setState((current) => current.kind === "code" ? { ...current, busy: null, notice: "Enter the 6-digit code from the email." } : current);
        return;
      case "failure":
        if (outcome.failure === "signed-out") return sessionLost.current();
        const failure = outcome.failure;
        if (failure === "no-code") return void load();
        if (failure === "expired" || failure === "other-browser") {
          decided.current = true;
          setState({ kind: "ended", reason: failure, clientKind: kind });
          return;
        }
        setState((current) => current.kind === "code" ? { ...current, busy: null, notice: codeFailureNotice(failure) } : current);
    }
  }

  async function resendCode() {
    if (state.kind !== "code" || state.busy !== null || decided.current) return;
    const { request } = state;
    setState({ ...state, busy: "resend", notice: null });
    try {
      const pending = await resendConsentCode(token, request.id);
      if (!alive.current) return;
      setState((current) => current.kind === "code"
        ? { ...current, busy: null, code: "", pending, notice: `We sent a new code to ${pending.emailHint || "your email"}. The earlier code no longer works.` }
        : current);
    } catch (error) {
      if (!alive.current) return;
      const failure = consentFailure(error);
      if (failure === "signed-out") return sessionLost.current();
      if (failure === "expired" || failure === "other-browser") {
        decided.current = true;
        setState({ kind: "ended", reason: failure, clientKind: request.clientKind });
        return;
      }
      const noMore = error instanceof ApiError && error.status === 429 && /no more codes/i.test(error.message);
      setState((current) => current.kind === "code"
        ? { ...current, busy: null, pending: noMore ? { ...current.pending, resendsLeft: 0 } : current.pending,
            notice: noMore ? "No more codes can be sent for this connection. Use the last code, or start connecting again." : codeFailureNotice(failure) }
        : current);
    }
  }

  /** Don't allow, from the code step: the same decision as before the code was sent. */
  async function denyFromCode() {
    if (state.kind !== "code" || state.busy !== null || decided.current) return;
    const { request } = state;
    setState({ ...state, busy: "deny", notice: null });
    const outcome = await decide(token, request, false, { allowAct: false });
    if (!alive.current) return;
    if (outcome.kind === "navigate") {
      decided.current = true;
      rememberAnswer(request.id, false);
      setState({ kind: "leaving", approve: false, clientKind: request.clientKind });
      window.location.assign(outcome.url);
      return;
    }
    if (outcome.kind === "failure" && outcome.failure === "signed-out") return sessionLost.current();
    if (outcome.kind === "failure" && (outcome.failure === "expired" || outcome.failure === "other-browser")) {
      decided.current = true;
      setState({ kind: "ended", reason: outcome.failure, clientKind: request.clientKind });
      return;
    }
    setState((current) => current.kind === "code"
      ? { ...current, busy: null, notice: outcome.kind === "failure" ? codeFailureNotice(outcome.failure) : "Something went wrong on this page. Reload it and try again." }
      : current);
  }

  const shown: ConsentState = state.kind === "request" ? { ...state, armed } : state;
  return (
    <ConsentScreen
      state={shown}
      macNotice={macNotice}
      onAllow={(fromPointer) => void submit(true, fromPointer)}
      onDeny={() => void submit(false)}
      onToggleAct={(allow) => setState((current) => (current.kind === "request" ? { ...current, allowAct: allow } : current))}
      onPickAccessMode={(mode) => setState((current) => (current.kind === "request" ? { ...current, accessMode: mode } : current))}
      onPickMac={(macId) => setState((current) => (current.kind === "request" ? { ...current, macId } : current))}
      onSwitchAccount={() => void onSwitchAccount()}
      onRetry={() => void load()}
      onCodeChange={(code) => setState((current) => (current.kind === "code" ? { ...current, code: cleanCode(code) } : current))}
      onConfirmCode={() => void confirmCode()}
      onResendCode={() => void resendCode()}
      onDenyCode={() => void denyFromCode()}
    />
  );
}

/** A code lives ten minutes from its last send (the API's clock decides). */
const CODE_LIFETIME_MS = 10 * 60_000;

function codeState(request: ConsentRequest, email: string, pending: CodePending, notice: string | null): ConsentState {
  return { kind: "code", request, email, pending, code: "", busy: null, notice };
}

function wrongCodeNotice(attemptsLeft: number): string {
  if (attemptsLeft <= 0) return "That code is not right.";
  return `That code is not right. ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`;
}

function codeFailureNotice(failure: ConsentFailure): string {
  switch (failure) {
    case "rate-limited": return "Too many attempts in a short time. Wait a minute, then try again.";
    case "unavailable": return "The email could not be sent just now. Try sending a new code in a moment.";
    case "unreachable": return "Toone could not be reached. Check your connection and try again.";
    case "not-allowed": return "This connection belongs to another account. Switch to that account to finish it.";
    default: return "Something went wrong on this page. Reload it and try again.";
  }
}
