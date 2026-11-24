"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthPage from "@/components/AuthPage";
import { logout, type ToneSession } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import {
  consentFailure,
  decide,
  getConsentRequest,
  listConnectorMacs,
  expiryTimerMs,
  type ClientKind,
  type ConsentFailure,
} from "@/lib/connect/consent";
import ConsentScreen, { type ConsentState, type EndedReason } from "./ConsentScreen";

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
  const load = useCallback(async () => {
    setState({ kind: "loading" });
    let kind: ClientKind | null = null;
    try {
      const request = await getConsentRequest(token, requestId);
      kind = request.clientKind;
      if (!alive.current) return;
      setState({
        kind: "request", request, email,
        macs: request.eligible ? { status: "loading" } : { status: "hidden" },
        allowAct: request.scopes.includes("act"), macId: null, busy: null, notice: null,
      });
      if (!request.eligible) return;
      // Which Macs Claude can reach is a help, not a condition: a failure hides it.
      const macs = await listConnectorMacs(token).then(
        (list) => ({ status: "list" as const, macs: list }),
        () => ({ status: "hidden" as const }),
      );
      if (alive.current) setState((current) => (current.kind === "request" ? { ...current, macs } : current));
    } catch (error) {
      if (!alive.current) return;
      const failure = consentFailure(error);
      if (failure === "signed-out") return sessionLost.current();
      setState({ kind: "ended", reason: ENDS_ON_LOAD[failure] ?? "unreachable", clientKind: kind });
    }
  }, [token, email, requestId]);

  useEffect(() => { void load(); }, [load]);

  // The request lapses after ten minutes: say so instead of letting Allow fail.
  const expiresAt = state.kind === "request" ? state.request.expiresAt : null;
  const clientKind = state.kind === "request" ? state.request.clientKind : null;
  useEffect(() => {
    if (expiresAt === null) return;
    const left = expiryTimerMs({ expiresAt });
    if (left === null) return;
    const timer = window.setTimeout(() => {
      if (decided.current) return;
      setState((current) => (current.kind === "request" && current.busy === null
        ? { kind: "ended", reason: "expired", clientKind }
        : current));
    }, left);
    return () => window.clearTimeout(timer);
  }, [expiresAt, clientKind]);

  async function submit(approve: boolean) {
    if (state.kind !== "request" || state.busy !== null || decided.current) return;
    const { request, allowAct, macId } = state;
    setState({ ...state, busy: approve ? "allow" : "deny", notice: null });
    const outcome = await decide(token, request, approve, allowAct, undefined, macId);
    if (!alive.current) return;
    const kind = request.clientKind;
    if (outcome.kind === "navigate") {
      decided.current = true;
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
        decided.current = outcome.failure === "expired";
        setState({ kind: "ended", reason: outcome.failure, clientKind: kind });
        return;
      case "needs-pro":
      case "not-allowed":
        // The request stays pending: explain, keep "Don't allow".
        setState({
          kind: "request", request: { ...request, eligible: false,
            ineligibleReason: outcome.failure === "needs-pro" ? "subscription_required" : "not_allowed" },
          email, macs: { status: "hidden" }, allowAct, macId, busy: null, notice: null,
        });
        return;
      default:
        setState((current) => (current.kind === "request" ? { ...current, busy: null, notice: outcome.failure } : current));
    }
  }

  return (
    <ConsentScreen
      state={state}
      onAllow={() => void submit(true)}
      onDeny={() => void submit(false)}
      onToggleAct={(allow) => setState((current) => (current.kind === "request" ? { ...current, allowAct: allow } : current))}
      onPickMac={(macId) => setState((current) => {
        if (current.kind !== "request" || current.macs.status !== "list") return current;
        // The most recent Mac is the default: picking it again sends nothing.
        return { ...current, macId: macId === current.macs.macs[0]?.id ? null : macId };
      })}
      onSwitchAccount={() => void onSwitchAccount()}
      onRetry={() => void load()}
    />
  );
}
