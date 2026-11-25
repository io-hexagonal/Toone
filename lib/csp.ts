/**
 * Content Security Policy, two levels (proxy.ts picks one per path).
 *
 * Strict (`buildCsp`), on every page that can use or show the session and
 * every page that renders content written by others (STRICT_SECTIONS):
 * scripts only from this origin, scripts carrying this request's nonce, and
 * the three third-party scripts the site loads on purpose. No
 * `'unsafe-inline'`, no `'unsafe-eval'` (development adds `'unsafe-eval'` for
 * React's dev tooling only). Next.js reads the nonce from the request's CSP
 * header and puts it on its bootstrap and flight-data scripts, which only
 * happens for pages rendered per request: each strict section's layout
 * awaits `connection()` (components/StrictCspLayout.tsx).
 *
 * Static (`buildStaticCsp`), on the statically cached pages with no outside
 * content (home, marketing, legal, docs). A prerendered page has no nonce, and
 * its inline flight-data scripts carry that page's own render output, so
 * hashes would differ per page and per revalidation and could only be served
 * from a per-path manifest built after the pages. Those pages therefore allow
 * inline scripts; script hosts are still limited to this origin and the same
 * three third-party scripts, with `object-src 'none'`, `base-uri 'none'`,
 * `form-action 'self'` and the same `frame-ancestors`.
 *
 * The session token is readable by page script (lib/api.ts keeps it in
 * localStorage), so the strict policy is the second line of defence behind
 * React's escaping where the session or outside content is.
 *
 * Origins, and why each is here:
 * - accounts.google.com/gsi: Google Identity Services. The client script, its
 *   stylesheet, the sign-in button iframe and its status calls (Google's own
 *   CSP guidance for GIS).
 * - appleid.cdn-apple.com: the Sign in with Apple script and Apple's button
 *   artwork. The sign-in itself runs in a popup on appleid.apple.com, which
 *   this page's CSP does not govern.
 * - analytics.truleaf.org: the cookieless analytics script and its beacon,
 *   loaded only after the visitor allows analytics (components/PrivacyChoices.tsx).
 * - The API origins: account calls from the browser (NEXT_PUBLIC_API_BASE_URL)
 *   and Explore covers and Journal images served by the API
 *   (EXPLORE_API_BASE_URL). Both default to https://api.trytoone.com.
 * - The directory badge hosts (lib/featured-badges.ts): images only. The
 *   directories check that their issued badge image is hot-linked, so the
 *   images are not self-hosted.
 * Stripe is never loaded in the page: checkout and the billing portal are
 * full-page redirects to Stripe-hosted pages (lib/billing/stripe-url.ts).
 *
 * Styles keep `'unsafe-inline'`: React `style` attributes are used throughout
 * the site and a nonce cannot cover attributes. Injected CSS cannot run
 * script, and `img-src`/`connect-src`/`font-src` still bound where it can
 * load from.
 */

/**
 * First path segment (after the locale) of every section served with the
 * strict policy. Each must render per request (tests/security/csp.test.ts
 * checks that its layout awaits `connection()`).
 */
export const STRICT_SECTIONS = [
  // Pages that use or show the session.
  "account", "admin", "cancel", "cancel-contract", "connect", "connections", "create-account", "creators",
  "downloads", "early-access", "how-to", "invite", "pricing", "redeem", "reset-password", "signin", "signup",
  "success", "unsubscribe", "welcome",
  // Pages that render content written by others (Journal, Explore, creator profiles).
  "explore", "journal", "r", "resources",
] as const;

/** Statically cached sections with no outside content: the static policy. */
export const STATIC_SECTIONS = [
  "about", "ai-digest", "business", "claude", "contact", "docs-ui-gallery", "download", "editorial-policy",
  "governance", "guides", "legal-notice", "newcomers", "privacy", "request-access", "showcases", "terms",
] as const;

const STRICT_PATH = new RegExp(`^(?:/[a-z]{2})?/(?:${STRICT_SECTIONS.join("|")})(?:/|$)`);

/** True when `pathname` (locale-prefixed or not) is served with the strict policy. */
export function isStrictPath(pathname: string): boolean {
  return STRICT_PATH.test(pathname);
}

export const GOOGLE_GSI = "https://accounts.google.com/gsi/";
export const GOOGLE_GSI_CLIENT = "https://accounts.google.com/gsi/client";
export const GOOGLE_GSI_STYLE = "https://accounts.google.com/gsi/style";
export const APPLE_CDN = "https://appleid.cdn-apple.com";
export const APPLE_JS = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/";
export const ANALYTICS_ORIGIN = "https://analytics.truleaf.org";
export const ANALYTICS_SCRIPT = "https://analytics.truleaf.org/script.js";
export const DEFAULT_API_ORIGIN = "https://api.trytoone.com";

/** Hosts of the "Featured on" badge images (lib/featured-badges.ts). */
export const BADGE_IMAGE_ORIGINS = [
  "https://api.producthunt.com",
  "https://macigniter.com",
  "https://dodolaunch.com",
  "https://macbase.app",
  "https://statics.startupbase.io",
  "https://startupfa.me",
] as const;

/** Vercel's comment toolbar, allowed on preview deployments only. */
const VERCEL_LIVE = "https://vercel.live";

export type CspOptions = {
  nonce: string;
  /** `'none'` on the consent page, `'self'` everywhere else. */
  frameAncestors: "'self'" | "'none'";
  /** Origins of NEXT_PUBLIC_API_BASE_URL and EXPLORE_API_BASE_URL. */
  apiOrigins?: readonly string[];
  development?: boolean;
  preview?: boolean;
};

/** `https://host[:port]` of an absolute http(s) URL, or null. */
export function originOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** The API origins the browser talks to and loads images from, deduplicated. */
export function apiOriginsFromEnv(env: Record<string, string | undefined>): string[] {
  const origins = [
    originOf(env.NEXT_PUBLIC_API_BASE_URL) ?? DEFAULT_API_ORIGIN,
    originOf(env.EXPLORE_API_BASE_URL) ?? DEFAULT_API_ORIGIN,
  ];
  return [...new Set(origins)];
}

/** A fresh nonce: 128 random bits, base64. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** The strict policy: scripts by nonce (and the three third-party scripts) only. */
export function buildCsp(options: CspOptions): string {
  if (!/^[A-Za-z0-9+/=]{16,}$/.test(options.nonce)) throw new Error("invalid CSP nonce");
  return policy(options, [`'nonce-${options.nonce}'`]);
}

/** The static-page policy: inline scripts allowed (no nonce on prerendered HTML), hosts still limited. */
export function buildStaticCsp(options: Omit<CspOptions, "nonce">): string {
  return policy(options, ["'unsafe-inline'"]);
}

function policy(options: Omit<CspOptions, "nonce">, inline: string[]): string {
  const { frameAncestors, development = false, preview = false } = options;
  const api = options.apiOrigins?.length ? options.apiOrigins : [DEFAULT_API_ORIGIN];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      ...inline,
      GOOGLE_GSI_CLIENT,
      APPLE_JS,
      ANALYTICS_SCRIPT,
      ...(development ? ["'unsafe-eval'"] : []),
      ...(preview ? [VERCEL_LIVE] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", GOOGLE_GSI_STYLE],
    "img-src": ["'self'", "data:", "blob:", ...api, APPLE_CDN, ...BADGE_IMAGE_ORIGINS, ...(preview ? ["https://vercel.com", VERCEL_LIVE] : [])],
    "font-src": ["'self'", ...(preview ? [VERCEL_LIVE] : [])],
    "connect-src": [
      "'self'",
      ...api,
      GOOGLE_GSI,
      ANALYTICS_ORIGIN,
      ...(development ? ["ws:", "wss:"] : []),
      ...(preview ? [VERCEL_LIVE, "wss://ws-us3.pusher.com"] : []),
    ],
    "media-src": ["'self'"],
    "frame-src": [GOOGLE_GSI, ...(preview ? [VERCEL_LIVE] : [])],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": [frameAncestors],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Browser features no page uses, denied to the page and every frame it embeds
 * (next.config.ts). FedCM (`identity-credentials-get`) is left alone because
 * Google sign-in uses it; fullscreen and clipboard stay available.
 */
export const PERMISSIONS_POLICY = [
  "accelerometer", "bluetooth", "browsing-topics", "camera", "display-capture", "geolocation",
  "gyroscope", "hid", "magnetometer", "microphone", "midi", "payment", "serial", "usb",
].map((feature) => `${feature}=()`).join(", ");

/** Request header the root layout reads the nonce from (Next.js reads the CSP header itself). */
export const NONCE_HEADER = "x-nonce";
