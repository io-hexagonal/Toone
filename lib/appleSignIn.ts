/**
 * Sign in with Apple on the web (Apple JS, popup mode).
 *
 * The browser only ever holds the public Services ID. Apple returns an
 * identity token (a signed JWT) that is forwarded once to the Toone API,
 * which verifies issuer, signature, expiry, audience and email_verified.
 * The authorization code is never sent anywhere: the server holds no client
 * secret and, by decision, no Apple tokens (account deletion directs people to
 * revoke Toone in their Apple Account settings). Nothing here is logged.
 */

export const APPLE_SCRIPT_ID = "apple-signin-js";

/** Locales Apple JS ships for its popup UI, keyed by the site's locales. */
const APPLE_JS_LOCALES: Record<string, string> = {
  en: "en_US",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  nl: "nl_NL",
  pt: "pt_BR",
  ru: "ru_RU",
};

export type AppleSignInConfig = {
  /** Services ID registered for the website (the id_token audience). */
  clientId: string;
  /** Return URL registered on that Services ID; required even in popup mode. */
  redirectURI: string;
};

/** Minimal surface of Apple JS that the site uses. */
export type AppleIDAuth = {
  init: (config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    state?: string;
    usePopup: boolean;
  }) => void;
  signIn: () => Promise<AppleSignInResponse>;
};

export type AppleSignInUser = {
  name?: { firstName?: string; lastName?: string };
  email?: string;
};

export type AppleSignInResponse = {
  authorization?: { id_token?: string; code?: string; state?: string };
  /** Present only on the person's first authorization for this Services ID. */
  user?: AppleSignInUser;
};

declare global {
  interface Window {
    AppleID?: { auth: AppleIDAuth };
  }
}

/**
 * Validates configuration. Both values must be present and the return URL
 * must be an absolute https URL (Apple rejects anything else), so an
 * unconfigured or misconfigured deployment simply hides the button.
 */
export function resolveAppleSignInConfig(
  clientId: string | undefined,
  redirectURI: string | undefined,
): AppleSignInConfig | null {
  const id = clientId?.trim() ?? "";
  const uri = redirectURI?.trim() ?? "";
  if (!id || !uri) return null;
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "https:" || parsed.hash) return null;
  } catch {
    return null;
  }
  return { clientId: id, redirectURI: uri };
}

/** Deployment configuration. Literal `process.env.NEXT_PUBLIC_*` reads are inlined by Next. */
export function appleSignInConfig(): AppleSignInConfig | null {
  return resolveAppleSignInConfig(
    process.env.NEXT_PUBLIC_APPLE_SERVICES_ID,
    process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
  );
}

export function appleScriptURL(locale: string): string {
  const appleLocale = APPLE_JS_LOCALES[locale] ?? APPLE_JS_LOCALES.en;
  return `https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/${appleLocale}/appleid.auth.js`;
}

/** Apple-supplied button artwork keeps the logo, title and spacing approved. */
export function appleButtonURL(locale: string, type: "sign-in" | "continue"): string {
  const appleLocale = APPLE_JS_LOCALES[locale] ?? APPLE_JS_LOCALES.en;
  const params = new URLSearchParams({
    color: "white", height: "40", width: "356", type,
    border_radius: "4", scale: "2", locale: appleLocale,
  });
  return `https://appleid.cdn-apple.com/appleid/button?${params}`;
}

/**
 * Apple sends the name once, on first authorization, and never inside the
 * identity token. It is forwarded as untrusted display text; the server
 * sanitizes it again.
 */
export function appleDisplayName(user: AppleSignInUser | undefined): string {
  const parts = [user?.name?.firstName, user?.name?.lastName]
    .map(part => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  return parts.join(" ").slice(0, 100);
}

/** Closing the popup or declining is an ordinary cancellation, not an error. */
export function isAppleCancellation(error: unknown): boolean {
  const code = error && typeof error === "object" ? (error as { error?: unknown }).error : undefined;
  return code === "popup_closed_by_user" || code === "user_cancelled_authorize";
}

/** A fresh, unguessable value that binds a popup response to this request. */
export function newAppleState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export class AppleSignInError extends Error {
  constructor(public readonly reason: "missing_token" | "state_mismatch") {
    super(`Apple sign-in failed: ${reason}`);
    this.name = "AppleSignInError";
  }
}

/**
 * Extracts what the Toone API needs from Apple's response. The state must
 * echo the one sent; the authorization code is deliberately ignored.
 */
export function readAppleResponse(
  response: AppleSignInResponse,
  expectedState: string,
): { idToken: string; name: string } {
  const authorization = response?.authorization;
  if (authorization?.state !== expectedState) throw new AppleSignInError("state_mismatch");
  const idToken = authorization?.id_token;
  if (typeof idToken !== "string" || !idToken) throw new AppleSignInError("missing_token");
  return { idToken, name: appleDisplayName(response.user) };
}

let scriptPromise: Promise<AppleIDAuth> | null = null;

/** Loads Apple JS once per page. A failed load can be retried. */
export function loadAppleScript(locale: string): Promise<AppleIDAuth> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.AppleID?.auth) return Promise.resolve(window.AppleID.auth);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<AppleIDAuth>((resolve, reject) => {
    const fail = () => {
      scriptPromise = null;
      document.getElementById(APPLE_SCRIPT_ID)?.remove();
      reject(new Error("Apple JS unavailable"));
    };
    const done = () => (window.AppleID?.auth ? resolve(window.AppleID.auth) : fail());
    let script = document.getElementById(APPLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = APPLE_SCRIPT_ID;
      script.src = appleScriptURL(locale);
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", fail, { once: true });
  });
  return scriptPromise;
}

/**
 * Apple's popup posts its result to the opener only when the page origin is
 * the return URL's origin. Elsewhere (preview deployments, www before its
 * redirect, local hosts) the flow cannot complete, so the button hides.
 */
export function appleOriginMatches(config: AppleSignInConfig, pageOrigin: string): boolean {
  try {
    return new URL(config.redirectURI).origin === pageOrigin;
  } catch {
    return false;
  }
}
