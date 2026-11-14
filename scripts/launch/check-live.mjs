#!/usr/bin/env node
// Website half of the 00:30 UTC launch check (launch-cutover spec, "Morning
// check"). Read-only: it fetches public production URLs, signs nobody up and
// writes nothing. Exits 0 when the site serves the launched funnel, 1 if any
// check fails, with one line per check.
//
//   node scripts/launch/check-live.mjs
//   node scripts/launch/check-live.mjs --base https://preview-url.vercel.app
//   node scripts/launch/check-live.mjs --base http://localhost:3000 --now 2026-11-18T00:30:00Z
//
// `--now` only changes the instant the modal window is judged against (for a
// dry run against a server whose clock is shifted); production runs omit it.
// The base can also come from LAUNCH_CHECK_BASE. Run it before the launch and
// every check is expected to fail: that is the pre-launch state.

const argBase = process.argv.indexOf("--base");
const BASE = (argBase > -1 ? process.argv[argBase + 1] : process.env.LAUNCH_CHECK_BASE || "https://trytoone.com").replace(/\/$/, "");
const argNow = process.argv.indexOf("--now");
const NOW = argNow > -1 ? Date.parse(process.argv[argNow + 1]) : Date.now();
if (Number.isNaN(NOW)) throw new Error("--now needs an ISO date, e.g. 2026-11-18T00:30:00Z");
const MODAL_ID = "public-launch-2026-11";
const UA = "toone-launch-check/1.0";

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function get(path, { follow = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: follow ? "follow" : "manual",
    headers: { "user-agent": UA, "accept-language": "en", "cache-control": "no-cache" },
    signal: AbortSignal.timeout(20_000),
  });
  const location = res.headers.get("location");
  const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
  return { status: res.status, location, body, cacheControl: res.headers.get("cache-control") ?? "" };
}

async function check(name, fn) {
  try {
    await fn();
  } catch (error) {
    record(name, false, `error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/* /en/download: a temporary redirect into sign-up (signed out), never to /request-access. */
await check("/en/download leads to sign-up, not /request-access", async () => {
  const res = await get("/en/download");
  const ok = res.status === 307 && /\/en\/signup\?next=%2Fdownloads/.test(res.location ?? "") && !/request-access/.test(res.location ?? "");
  record("/en/download leads to sign-up, not /request-access", ok, `${res.status} -> ${res.location ?? "(no redirect)"}`);
  record("/en/download redirect is never stored", /no-store/.test(res.cacheControl), `cache-control: ${res.cacheControl || "(none)"}`);
});

/* /en/signup: served (200), the open sign-up page. */
await check("/en/signup serves open sign-up", async () => {
  const res = await get("/en/signup");
  const ok = res.status === 200 && /Create your Toone account/.test(res.body);
  record("/en/signup serves open sign-up", ok, res.status === 200 ? (ok ? "200, sign-up page" : "200 but no sign-up title") : `${res.status} -> ${res.location ?? ""}`);
});

/* /en/request-access: now a temporary redirect to sign-up. */
await check("/en/request-access redirects to sign-up", async () => {
  const res = await get("/en/request-access");
  const ok = res.status === 307 && /\/en\/signup/.test(res.location ?? "");
  record("/en/request-access redirects to sign-up", ok, `${res.status} -> ${res.location ?? "(no redirect)"}`);
});

/*
 * Homepage HTML: the launched call to action, no request-access call to action.
 * Rendered anchors only: the translation catalogue in the page payload still
 * holds the pre-launch strings (kept for the pre-launch build), which is fine.
 */
let home = "";
await check("homepage shows the launched call to action", async () => {
  const res = await get("/en");
  home = res.body;
  const hasDownload = /href="\/en\/download"/.test(home) && /data-umami-event="download-cta"/.test(home);
  record("homepage shows the launched call to action", res.status === 200 && hasDownload, `${res.status}, download-cta ${hasDownload ? "present" : "missing"}`);
  const stale = [
    ['href="/en/request-access"', /href="\/en\/request-access/],
    ["request-early-access event", /data-umami-event="request-early-access"/],
    ["waitlist email field", /data-early-access-input/],
  ].filter(([, pattern]) => pattern.test(home)).map(([label]) => label);
  record("homepage has no request-access call to action", res.status === 200 && stale.length === 0, stale.length ? `found: ${stale.join(", ")}` : "none found");
});

/* Sitemap: lists the public funnel page, not /request-access. */
await check("sitemap lists the launched funnel", async () => {
  const res = await get("/sitemap.xml");
  const listed = /<loc>https:\/\/trytoone\.com\/en\/(signup|download)<\/loc>/.test(res.body);
  const old = /<loc>[^<]*\/request-access<\/loc>/.test(res.body);
  record("sitemap lists /en/signup (or /en/download)", res.status === 200 && listed, `${res.status}, ${listed ? "listed" : "missing"}`);
  record("sitemap no longer lists /request-access", res.status === 200 && !old, old ? "still listed" : "absent");
});

/* Launch modal: the entry ships in the production bundle and today is inside its window. */
await check("launch modal is active", async () => {
  if (!home) throw new Error("no homepage HTML");
  const scripts = [...new Set([...home.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((match) => match[1]))];
  let source = null;
  for (const script of scripts) {
    const res = await get(script);
    if (res.body.includes(MODAL_ID)) { source = res.body; break; }
  }
  if (!source) {
    record("launch modal is active", false, `entry ${MODAL_ID} not found in ${scripts.length} homepage scripts`);
    return;
  }
  const start = Date.parse("2026-11-18T00:00:00Z");
  const endMatch = source.match(new RegExp(`${MODAL_ID}[\\s\\S]{0,400}?endsAt:"([^"]+)"`)) ?? source.match(/endsAt:"(2026-11-25T[^"]+)"/);
  const end = endMatch ? Date.parse(endMatch[1]) : NaN;
  const now = NOW;
  const ok = !Number.isNaN(end) && now >= start && now <= end;
  record("launch modal is active", ok, `entry shipped; window 2026-11-18T00:00:00Z to ${endMatch?.[1] ?? "?"}; now ${new Date(now).toISOString()}`);
  record("pre-paint launch marker is on the page", /data-launched/.test(home), /data-launched/.test(home) ? "present" : "missing");
});

const failed = results.filter((result) => !result.ok);
const width = Math.max(...results.map((result) => result.name.length));
console.log(`Launch check (website) against ${BASE} at ${new Date().toISOString()}\n`);
for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name.padEnd(width)}  ${result.detail}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `, ${failed.length} failed` : ""}.`);
process.exit(failed.length ? 1 : 0);
