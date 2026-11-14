/**
 * The public launch gate: the one clock the whole site reads.
 *
 * Before LAUNCH_AT the site runs the invitation funnel (request access, codes,
 * /early-access). From LAUNCH_AT on it runs the public funnel: sign up, then
 * download. Nothing else in the site may compare dates for this switch; every
 * route, page, component, the sitemap and the proxy call `isLaunched()`.
 *
 * The API (api.trytoone.com) switches its registration from waitlist to open at
 * the same instant without a restart, so the site and the server flip together
 * with no deploy and no person involved.
 *
 * Tests inject the time (`isLaunched(someInstant)`, or node:test's Date mock);
 * they never edit LAUNCH_AT.
 */

export const LAUNCH_AT = "2026-11-18T00:00:00Z";
export const LAUNCH_AT_MS = Date.parse(LAUNCH_AT);

/** True at and after the launch instant. */
export function isLaunched(now: number = Date.now()): boolean {
  return now >= LAUNCH_AT_MS;
}

/*
 * CAPABILITY HOOK (the one place to add it).
 *
 * The API will report its effective registration mode on the public
 * `GET /v1/capabilities` document; the field name is not final yet, so the
 * site gates on the clock alone. When the name is settled, read it where the
 * sign-up form loads (components/AuthPage.tsx, mode "signup", which already
 * fetches that document for `features.verified_email_signup`) and keep the
 * clock as the default: the capability may only *confirm* or *delay* the open
 * sign-up form, never move the page routes, which must stay request-time and
 * dependency-free. Until then a server still in waitlist mode answers
 * `registration_closed`, which AuthPage already explains.
 */

/**
 * A tiny inline script for <head>: marks <html data-launched> before first
 * paint once the visitor's clock has passed the launch. CSS then hides the
 * pre-launch variant of every <LaunchSwitch> on pages whose HTML was rendered
 * before the launch (statically built chrome), so nobody sees the old call to
 * action flash before hydration swaps it.
 */
export const LAUNCH_MARKER_SCRIPT =
  `if(Date.now()>=${LAUNCH_AT_MS})document.documentElement.setAttribute("data-launched","")`;
