"use client";

import { useEffect, useRef, useState } from "react";
import {
  appleButtonURL,
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
  buttonType: "sign-in" | "continue";
  unavailableLabel: string;
  disabled?: boolean;
  onCredential: (credential: { idToken: string; name: string }) => void;
  onFailure: () => void;
};

/**
 * The button face is served by Apple, including its logo and localized title.
 * Apple JS is loaded lazily and the popup opens straight from the click so
 * browsers keep the user gesture and each request gets a fresh state.
 */
export default function AppleSignInButton({
  config, locale, label, buttonType, unavailableLabel, disabled, onCredential, onFailure,
}: Props) {
  const [scriptState, setScriptState] = useState<"loading" | "ready" | "unavailable" | "hidden">("loading");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!config) return;
    if (!appleOriginMatches(config, window.location.origin)) {
      setScriptState("hidden");
      return;
    }
    let cancelled = false;
    loadAppleScript(locale).then(
      () => { if (!cancelled) setScriptState("ready"); },
      () => { if (!cancelled) setScriptState("unavailable"); },
    );
    return () => { cancelled = true; };
  }, [config, locale]);

  if (!config || scriptState === "hidden") return null;
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
      aria-label={label}
    >
      {/* Apple's own localized artwork; the image is decorative because the button has a label. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={appleButtonURL(locale, buttonType)}
        width={356}
        height={40}
        alt=""
        aria-hidden="true"
        onError={() => setScriptState("unavailable")}
      />
    </button>
  );
}
