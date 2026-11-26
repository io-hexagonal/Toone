"use client";

import { useEffect, useRef, useState } from "react";
import {
  appleOriginMatches,
  isAppleCancellation,
  loadAppleScript,
  newAppleState,
  readAppleResponse,
  type AppleSignInConfig,
} from "@/lib/appleSignIn";

type Props = {
  /** Null while the deployment has no Services ID: the button is not rendered. */
  config: AppleSignInConfig | null;
  locale: string;
  label: string;
  unavailableLabel: string;
  disabled?: boolean;
  onCredential: (credential: { idToken: string; name: string }) => void;
  onFailure: () => void;
};

/**
 * Our own button face (Apple logo + localized title), styled like the rest of
 * the sign-in card, as Apple's guidelines allow for custom buttons. Apple JS is loaded lazily and the popup opens straight from the click so
 * browsers keep the user gesture and each request gets a fresh state.
 *
 * Nothing renders until mount: Apple's button CDN answers crawlers with 403,
 * so artwork in the server HTML showed up as a broken image in site audits.
 */
export default function AppleSignInButton({
  config, locale, label, unavailableLabel, disabled, onCredential, onFailure,
}: Props) {
  const [scriptState, setScriptState] = useState<"mounting" | "loading" | "ready" | "unavailable" | "hidden">("mounting");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!config) return;
    if (!appleOriginMatches(config, window.location.origin)) {
      setScriptState("hidden");
      return;
    }
    setScriptState("loading");
    let cancelled = false;
    loadAppleScript(locale).then(
      () => { if (!cancelled) setScriptState("ready"); },
      () => { if (!cancelled) setScriptState("unavailable"); },
    );
    return () => { cancelled = true; };
  }, [config, locale]);

  if (!config || scriptState === "mounting" || scriptState === "hidden") return null;
  if (scriptState === "unavailable") {
    return <p className="auth-google-unavailable" role="status">{unavailableLabel}</p>;
  }

  function start() {
    const auth = window.AppleID?.auth;
    if (!config || !auth || pendingRef.current || disabled) return;
    pendingRef.current = true;
    setPending(true);
    const expectedState = newAppleState();
    let signIn: Promise<Parameters<typeof readAppleResponse>[0]>;
    try {
      auth.init({
        clientId: config.clientId,
        scope: "name email",
        redirectURI: config.redirectURI,
        state: expectedState,
        usePopup: true,
      });
      signIn = auth.signIn();
    } catch {
      pendingRef.current = false;
      setPending(false);
      onFailure();
      return;
    }
    signIn
      .then(response => onCredential(readAppleResponse(response, expectedState)))
      .catch(error => { if (!isAppleCancellation(error)) onFailure(); })
      .finally(() => {
        pendingRef.current = false;
        setPending(false);
      });
  }

  const busy = pending || scriptState === "loading";
  return (
    <button
      type="button"
      className="auth-apple"
      onClick={start}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
