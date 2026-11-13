/**
 * Guards every redirect the site makes to a Stripe-hosted page. The API
 * returns the URL; the browser only follows it when it is an https URL on an
 * exact allow-listed host, with no credentials and no explicit port.
 */

export type StripeRedirectKind = "checkout" | "portal";

/**
 * The only hosts the site redirects to, per flow. Exact hostnames, no
 * wildcards. Under Stripe Managed Payments, Checkout may be served from a
 * different Stripe-operated (or Link) host: confirm the real host while
 * setting up the Stripe sandbox and add it here, exactly, before go-live.
 */
export const STRIPE_REDIRECT_HOSTS: Readonly<Record<StripeRedirectKind, readonly string[]>> = Object.freeze({
  checkout: Object.freeze(["checkout.stripe.com"]),
  portal: Object.freeze(["billing.stripe.com"]),
});

/**
 * TEST-ONLY: extra `host` or `host:port` entries for the local fake Stripe of
 * a local end-to-end test harness, from
 * `NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS` (comma-separated). Honoured only
 * when the variable is set AND `NODE_ENV !== "production"`. `next build`
 * inlines `NODE_ENV` as "production", so a production bundle drops this
 * branch entirely, whatever the variable says.
 */
export function testRedirectHosts(): readonly string[] {
  // Literal `process.env.*` reads: the bundler inlines both, and in a
  // production build the early return makes the rest dead code.
  if (process.env.NODE_ENV === "production") return [];
  const raw = process.env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[a-z0-9.-]+(:\d{1,5})?$/.test(entry));
}

function allowedTestUrl(url: string, parsed: URL): string | null {
  const hosts = testRedirectHosts();
  if (hosts.length === 0) return null;
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  return hosts.includes(parsed.host) && url.toLowerCase().startsWith(`https://${parsed.host}/`) ? parsed.href : null;
}

/**
 * The normalized URL to navigate to, or null when `url` is not a safe Stripe
 * page for `kind`. Navigate to the returned value, never to the raw input.
 */
export function allowedStripeUrl(url: unknown, kind: StripeRedirectKind): string | null {
  if (typeof url !== "string" || !url || url.length > 4096) return null;
  // Whitespace and control characters are silently stripped by the URL
  // parser, which hides what is actually being followed.
  if (/[\u0000- \u007f-\u009f\\]/.test(url)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const testUrl = allowedTestUrl(url, parsed);
  if (testUrl) return testUrl;
  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.port) return null;
  const hosts = STRIPE_REDIRECT_HOSTS[kind];
  if (!hosts || !hosts.includes(parsed.hostname)) return null;
  // Refuse anything the parser had to repair (e.g. "https:checkout.stripe.com").
  if (!url.toLowerCase().startsWith(`https://${parsed.hostname}`)) return null;
  const next = url.charAt(`https://${parsed.hostname}`.length);
  if (next && next !== "/" && next !== "?" && next !== "#") return null;
  return parsed.href;
}

/** True when `url` is a safe Stripe page for `kind`. */
export function isAllowedStripeUrl(url: unknown, kind: StripeRedirectKind): boolean {
  return allowedStripeUrl(url, kind) !== null;
}
