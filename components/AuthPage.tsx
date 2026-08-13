"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import {
  ApiError,
  loadSession,
  loginEmail,
  loginGoogle,
  logout,
  signupEmail,
  type ToneSession,
} from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GSI_SCRIPT_ID = "google-gsi-client";
const GSI_RENDER_TIMEOUT_MS = 5_000;

type GoogleButtonState = "loading" | "ready" | "unavailable";

function isUnsupportedIOSWebView(): boolean {
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Threads identifies itself as Barcelona; the other tokens cover Meta's
  // sibling in-app browsers, which have the same unsupported GIS environment.
  return isIOS && /Threads|Barcelona|Instagram|FBAN|FBAV/i.test(ua);
}

/** Minimal surface of Google Identity Services we use (ID-token flow). */
type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

function track(event: string) {
  if (typeof window === "undefined") return;
  (window as unknown as { umami?: { track: (n: string) => void } }).umami?.track(
    event,
  );
}

type Mode = "signin" | "signup";

/**
 * Shared sign-in / sign-up page: dark ground, brand lockup, one card in the
 * HeroAuth idiom (same border/input/button/soon patterns). Google on top via
 * GIS renderButton (or the disabled "Soon" button when no client id is
 * configured), divider, then the email form. Success swaps the card for a
 * "you're signed in" panel pointing at the macOS download — the desktop app
 * is where the account is used.
 */
export default function AuthPage({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ToneSession | null>(null);
  const [googleButtonState, setGoogleButtonState] =
    useState<GoogleButtonState>("loading");
  const googleRef = useRef<HTMLDivElement>(null);
  // Refs so the GIS callback (registered once) sees fresh state without
  // re-initializing the button on every render.
  const busyRef = useRef(false);

  function friendlyError(e: unknown, viaGoogle = false): string {
    if (e instanceof ApiError) {
      switch (e.code) {
        case "already_exists":
          // Google flow: the backend rejects Google sign-in when the email
          // already has an email/password account — point there instead.
          return viaGoogle ? t("errExistsGoogle") : t("errExists");
        case "unauthorized":
          return t("errInvalid");
        case "invalid_input":
          return t("errInvalidInput");
        case "rate_limit_exceeded":
          return t("errRate");
      }
    }
    return t("errGeneric");
  }

  async function finish(
    promise: Promise<ToneSession>,
    event: string,
    viaGoogle = false,
  ) {
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const s = await promise;
      setSession(s);
      track(event);
    } catch (e) {
      setError(friendlyError(e, viaGoogle));
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const token = session?.token;
    setSession(null);
    setError(null);
    if (token) await logout(token); // clears localStorage even if the POST fails
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    // The server enforces password bounds in BYTES (bcrypt's 72-byte limit),
    // so measure UTF-8 bytes, not UTF-16 units. maxLength stays as a soft cap.
    const passwordBytes = new TextEncoder().encode(password).length;
    if (mode === "signup" && (passwordBytes < 8 || passwordBytes > 72)) {
      setError(t("errPasswordLength"));
      return;
    }
    if (mode === "signup") {
      await finish(
        signupEmail(email, password, name.trim() || undefined),
        "auth-signup-email",
      );
    } else {
      await finish(loginEmail(email, password), "auth-signin-email");
    }
  }

  // Consume a persisted session: a returning signed-in visitor sees the
  // success panel instead of a blank form. loadSession() drops expired ones.
  useEffect(() => {
    const s = loadSession();
    if (s) setSession(s);
  }, []);

  // Google Identity Services — loaded on the auth pages only.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let renderTimeout: number | undefined;

    const unavailable = () => {
      if (!cancelled) setGoogleButtonState("unavailable");
    };

    if (isUnsupportedIOSWebView()) {
      unavailable();
      return () => {
        cancelled = true;
      };
    }

    setGoogleButtonState("loading");
    renderTimeout = window.setTimeout(unavailable, GSI_RENDER_TIMEOUT_MS);

    const init = () => {
      const gsi = window.google?.accounts?.id;
      const parent = googleRef.current;
      if (cancelled || !gsi || !parent) return;
      try {
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (busyRef.current) return;
            void finish(loginGoogle(response.credential), "auth-google", true);
          },
        });
        parent.innerHTML = "";
        gsi.renderButton(parent, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "left",
          width: Math.min(356, Math.max(200, parent.clientWidth || 356)),
        });

        if (parent.childElementCount > 0) {
          window.clearTimeout(renderTimeout);
          setGoogleButtonState("ready");
        } else {
          unavailable();
        }
      } catch {
        unavailable();
      }
    };

    if (window.google?.accounts?.id) {
      init();
      return () => {
        cancelled = true;
        window.clearTimeout(renderTimeout);
      };
    }

    let script = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GSI_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", init);
    script.addEventListener("error", unavailable);
    return () => {
      cancelled = true;
      window.clearTimeout(renderTimeout);
      script?.removeEventListener("load", init);
      script?.removeEventListener("error", unavailable);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .auth-page {
              min-height: 100svh; background: #141413;
              display: flex; flex-direction: column; align-items: center;
              justify-content: center; padding: 48px 20px 64px;
            }
            .auth-brand {
              display: inline-flex; align-items: center; gap: 10px;
              text-decoration: none; margin-bottom: 34px;
            }
            .auth-brand img { width: 30px; height: 30px; display: block; }
            .auth-brand .wm {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
              color: rgba(255,255,255,0.92); font-size: 20px;
            }
            .auth-title {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.02em; line-height: 1.1;
              color: rgba(255,255,255,0.95); font-size: 27px;
              margin-bottom: 8px; text-align: center; text-wrap: balance;
            }
            .auth-sub {
              color: rgba(255,255,255,0.55); font-size: 15px;
              margin-bottom: 26px; text-align: center; max-width: 34ch;
            }
            .auth-card {
              width: 100%; max-width: 400px;
              border: 1px solid rgba(255,255,255,0.11); border-radius: 16px;
              background: rgba(255,255,255,0.03);
              padding: 22px; display: flex; flex-direction: column; gap: 12px;
            }
            .auth-gsi { display: flex; justify-content: center; min-height: 40px; }
            .auth-gsi > div { color-scheme: light; }
            .auth-gsi[aria-busy="true"]::after {
              content: ""; width: 18px; height: 18px; margin: auto;
              border: 2px solid rgba(255,255,255,0.2);
              border-top-color: rgba(255,255,255,0.72); border-radius: 50%;
              animation: auth-spin 0.8s linear infinite;
            }
            @keyframes auth-spin { to { transform: rotate(360deg); } }
            .auth-google-unavailable {
              min-height: 40px; padding: 11px 14px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.72);
              font-size: 12.5px; line-height: 1.45; text-align: center;
            }
            .auth-google-soon {
              display: flex; align-items: center; justify-content: center; gap: 10px;
              width: 100%; padding: 12px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.15); background: transparent;
              color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;
              cursor: default; position: relative;
            }
            .auth-google-soon svg { width: 17px; height: 17px; }
            .auth-google-soon .soon {
              position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
              font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
              color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.16);
              border-radius: 999px; padding: 2px 8px;
            }
            .auth-or {
              text-align: center; color: rgba(255,255,255,0.65);
              font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
            }
            .auth-input {
              width: 100%; padding: 12px 14px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.92);
              font-size: 14px; outline: none;
            }
            .auth-input::placeholder { color: rgba(255,255,255,0.62); }
            .auth-input:focus { border-color: rgba(255,255,255,0.35); }
            .auth-submit {
              width: 100%; padding: 12px; border-radius: 10px; border: none;
              background: #f0ede6; color: #1d1c19; cursor: pointer;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
              transition: transform 0.15s ease;
            }
            .auth-submit:hover { transform: scale(1.015); }
            .auth-submit:disabled { opacity: 0.6; transform: none; cursor: default; }
            .auth-error {
              color: rgba(255,138,122,0.95); font-size: 12.5px;
              text-align: center; margin: 0;
            }
            .auth-switch {
              color: rgba(255,255,255,0.65); font-size: 13.5px;
              text-align: center; margin-top: 20px;
            }
            .auth-switch a { color: rgba(255,255,255,0.88); text-decoration: none; }
            .auth-switch a:hover { text-decoration: underline; }

            .auth-success { text-align: center; padding: 10px 0 4px; }
            .auth-success .who {
              color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.5;
              margin-bottom: 6px; overflow-wrap: anywhere;
            }
            .auth-success .note {
              color: rgba(255,255,255,0.65); font-size: 13px; margin-bottom: 18px;
            }
            .auth-dl {
              display: inline-flex; align-items: center; justify-content: center; gap: 9px;
              width: 100%; padding: 12px; border-radius: 10px; border: none;
              background: #f0ede6; color: #1d1c19; text-decoration: none;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
              transition: transform 0.15s ease;
            }
            .auth-dl:hover { transform: scale(1.015); }
            .auth-dl svg { width: 17px; height: 17px; fill: currentColor; }
            .auth-signout {
              display: inline-block; margin-top: 16px;
              background: none; border: none; padding: 0; cursor: pointer;
              color: rgba(255,255,255,0.65); font-size: 12.5px;
            }
            .auth-signout:hover { color: rgba(255,255,255,0.75); text-decoration: underline; }
          `,
        }}
      />

      <main className="auth-page">
        <Link href="/" aria-label="Toone" className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/toone-mark.svg" alt="" />
          <span className="wm">toone</span>
        </Link>

        <h1 className="auth-title">
          {mode === "signup" ? t("signupTitle") : t("signinTitle")}
        </h1>
        <p className="auth-sub">
          {mode === "signup" ? t("signupSub") : t("signinSub")}
        </p>

        <div className="auth-card">
          {session ? (
            <div className="auth-success">
              <p className="who">
                {t("successTitle", { email: session.user.email })}
              </p>
              <p className="note">{t("successNote")}</p>
              <Link
                className="auth-dl"
                href="/download"
                data-umami-event="open-download-chooser"
                data-umami-event-placement="auth-success"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                {t("downloadMac")}
              </Link>
              <div>
                <button
                  className="auth-signout"
                  type="button"
                  onClick={() => void handleSignOut()}
                >
                  {t("signOut")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div
                    className="auth-gsi"
                    ref={googleRef}
                    hidden={googleButtonState === "unavailable"}
                    aria-busy={googleButtonState === "loading"}
                    aria-label={
                      googleButtonState === "loading"
                        ? t("googleLoading")
                        : undefined
                    }
                  />
                  {googleButtonState === "unavailable" && (
                    <p className="auth-google-unavailable" role="status">
                      {t("googleBrowserRequired")}
                    </p>
                  )}
                </>
              ) : (
                <button
                  className="auth-google-soon"
                  type="button"
                  aria-disabled="true"
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  {t("googleBtn")}
                  <span className="soon">{t("soon")}</span>
                </button>
              )}

              <div className="auth-or">{t("or")}</div>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {mode === "signup" && (
                  <input
                    className="auth-input"
                    type="text"
                    aria-label={t("namePh")}
                    autoComplete="name"
                    placeholder={t("namePh")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                <input
                  className="auth-input"
                  type="email"
                  aria-label={t("emailPh")}
                  autoComplete="email"
                  placeholder={t("emailPh")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="auth-input"
                  type="password"
                  aria-label={t("passwordPh")}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder={t("passwordPh")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  maxLength={72}
                />
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading
                    ? "…"
                    : mode === "signup"
                      ? t("signupBtn")
                      : t("signinBtn")}
                </button>
              </form>

              {error && <p className="auth-error">{error}</p>}
            </>
          )}
        </div>

        {!session && (
          <p className="auth-switch">
            {mode === "signup" ? (
              <>
                {t("haveAccount")} <Link href="/signin">{t("signinLink")}</Link>
              </>
            ) : (
              <>
                {t("newHere")} <Link href="/signup">{t("signupLink")}</Link>
              </>
            )}
          </p>
        )}
      </main>
    </>
  );
}
