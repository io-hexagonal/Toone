import assert from "node:assert/strict";
import fs from "node:fs";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";
import proxy, { LAUNCHED_SITEMAP_PATH, config, launchResponse } from "../../proxy";
import { LAUNCH_AT, LAUNCH_AT_MS, LAUNCH_MARKER_SCRIPT, isLaunched } from "../../lib/launch";
import { launchRedirect, signupForDownloadHref } from "../../lib/launch-routes";
import { siteSitemap } from "../../lib/site-sitemap";
import { GET as launchedSitemap } from "../../app/sitemap.xml/launched/route";
import { announcements } from "../../content/announcements";
import { publicLaunch } from "../../content/announcements/launch";
import { activeAnnouncement, previewAnnouncement } from "../../lib/announcements";

/*
 * The public launch gate (lib/launch.ts): one clock, 2026-11-18T00:00:00Z.
 * Every test injects the time; none edits LAUNCH_AT.
 */

const BEFORE = LAUNCH_AT_MS - 1;
const AT = LAUNCH_AT_MS;
const AFTER = Date.parse("2026-11-18T07:00:00Z");
const read = (path: string) => fs.readFileSync(path, "utf8");

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "https://trytoone.com"), { headers });
}

/** Runs the real proxy with the clock at `now` (node:test's Date mock). */
function proxyAt(now: number, path: string, headers: Record<string, string> = {}) {
  mock.timers.enable({ apis: ["Date"], now });
  try {
    return proxy(request(path, headers));
  } finally {
    mock.timers.reset();
  }
}

function assertTemporary(response: Response | null, location: string, message?: string) {
  assert.ok(response, message);
  assert.equal(response.status, 307, message);
  assert.equal(response.headers.get("location"), location, message);
  assert.equal(response.headers.get("cache-control"), "private, no-store", `${message ?? location}: never stored`);
}

/* ---- the gate */

test("the gate opens at exactly 2026-11-18T00:00:00Z", () => {
  assert.equal(LAUNCH_AT, "2026-11-18T00:00:00Z");
  assert.equal(new Date(LAUNCH_AT_MS).toISOString(), "2026-11-18T00:00:00.000Z");
  assert.equal(isLaunched(Date.parse("2026-11-17T23:59:59.999Z")), false, "one millisecond before");
  assert.equal(isLaunched(BEFORE), false);
  assert.equal(isLaunched(AT), true, "at the instant");
  assert.equal(isLaunched(AT + 1), true);
  assert.equal(isLaunched(AFTER), true);
  assert.equal(isLaunched(Date.parse("2026-11-14T12:00:00Z")), false, "today");
});

test("isLaunched() reads the current clock when no time is given", () => {
  mock.timers.enable({ apis: ["Date"], now: BEFORE });
  try {
    assert.equal(isLaunched(), false);
    mock.timers.tick(1);
    assert.equal(isLaunched(), true, "flips as the clock passes the instant");
  } finally {
    mock.timers.reset();
  }
});

test("the head marker script marks <html> only once the visitor's clock has passed the launch", () => {
  const run = (now: number) => {
    const attributes: Record<string, string> = {};
    const document = { documentElement: { setAttribute: (name: string, value: string) => { attributes[name] = value; } } };
    new Function("Date", "document", LAUNCH_MARKER_SCRIPT)({ now: () => now }, document);
    return attributes;
  };
  assert.deepEqual(run(BEFORE), {});
  assert.deepEqual(run(AT), { "data-launched": "" });
});

test("nothing else in the site keeps its own copy of the launch instant", () => {
  const files = fs.readdirSync(".", { recursive: true, encoding: "utf8" })
    .filter((file) => /^(app|components|lib|content|proxy)/.test(file) && /\.(ts|tsx)$/.test(file));
  const copies = files.filter((file) => file !== "lib/launch.ts" && /2026-11-18/.test(read(file)));
  assert.deepEqual(copies, []);
});

/* ---- funnel redirects (lib/launch-routes.ts) */

test("before the launch: /download and /signup are temporary redirects to the access request", () => {
  const empty = new URLSearchParams();
  assert.deepEqual(launchRedirect("/en/signup", empty, { now: BEFORE }), { location: "/en/request-access", varyOnCookie: false });
  assert.deepEqual(launchRedirect("/pt/download", empty, { now: BEFORE }), { location: "/pt/request-access", varyOnCookie: false });
  assert.deepEqual(
    launchRedirect("/en/download", new URLSearchParams("from=explore&item=routine:wfl_lnchprepqk4m2x7a&utm_source=x"), { now: BEFORE, signedIn: true }),
    { location: "/en/request-access?from=explore&item=routine%3Awfl_lnchprepqk4m2x7a", varyOnCookie: false },
    "Explore attribution is kept, anything else dropped, a session changes nothing",
  );
  assert.equal(launchRedirect("/en/request-access", empty, { now: BEFORE }), null, "the request page is served");
});

test("from the launch: /download leads to the grid or through sign-up to it, /request-access to sign-up, /signup is served", () => {
  const empty = new URLSearchParams();
  for (const now of [AT, AFTER]) {
    assert.deepEqual(launchRedirect("/en/download", empty, { now, signedIn: true }), { location: "/en/downloads", varyOnCookie: true });
    assert.deepEqual(launchRedirect("/en/download", empty, { now }), { location: "/en/signup?next=%2Fdownloads", varyOnCookie: true });
    assert.deepEqual(launchRedirect("/de/request-access", empty, { now }), { location: "/de/signup?next=%2Fdownloads", varyOnCookie: false });
    assert.equal(launchRedirect("/en/signup", empty, { now }), null);
  }
  assert.equal(
    launchRedirect("/en/download", new URLSearchParams("from=explore&item=bundle:wfb_ux67rregtrwv3k5g"), { now: AFTER })?.location,
    "/en/signup?next=%2Fdownloads&from=explore&item=bundle%3Awfb_ux67rregtrwv3k5g",
  );
  assert.equal(signupForDownloadHref("fr"), "/fr/signup?next=%2Fdownloads");
  assert.equal(launchRedirect("/en/downloads", empty, { now: AFTER }), null, "the grid itself is never redirected");
  assert.equal(launchRedirect("/en/early-access", empty, { now: AFTER }), null, "code holders keep /early-access");
  assert.equal(launchRedirect("/en/redeem", empty, { now: AFTER }), null, "and /redeem");
});

test("proxy: the same answers on every request, as uncached 307s", () => {
  assertTemporary(launchResponse(request("/en/download"), BEFORE), "https://trytoone.com/en/request-access");
  assertTemporary(launchResponse(request("/en/signup"), BEFORE), "https://trytoone.com/en/request-access");
  assert.equal(launchResponse(request("/en/request-access"), BEFORE), null);

  const signedOut = launchResponse(request("/en/download"), AT);
  assertTemporary(signedOut, "https://trytoone.com/en/signup?next=%2Fdownloads");
  assert.equal(signedOut?.headers.get("vary"), "Cookie");
  assertTemporary(
    launchResponse(request("/en/download", { cookie: "toone_site_session=tok" }), AT),
    "https://trytoone.com/en/downloads",
  );
  assertTemporary(launchResponse(request("/en/request-access?from=explore"), AFTER), "https://trytoone.com/en/signup?next=%2Fdownloads&from=explore");
  assert.equal(launchResponse(request("/en/signup"), AFTER), null);
  assert.equal(launchResponse(request("/en/pricing"), AFTER), null);
});

test("proxy (default export, real clock mocked): /en/download flips at the instant with no deploy", () => {
  assertTemporary(proxyAt(BEFORE, "/en/download"), "https://trytoone.com/en/request-access");
  assertTemporary(proxyAt(AT, "/en/download"), "https://trytoone.com/en/signup?next=%2Fdownloads");
  assertTemporary(proxyAt(BEFORE, "/en/signup"), "https://trytoone.com/en/request-access");
  assert.equal(proxyAt(AFTER, "/en/signup").headers.get("location"), null, "open sign-up is served");
  assertTemporary(proxyAt(AFTER, "/en/request-access"), "https://trytoone.com/en/signup?next=%2Fdownloads");
  assert.equal(proxyAt(BEFORE, "/en/request-access").headers.get("location"), null);
});

test("unprefixed funnel URLs get their locale first, then the gate", () => {
  const first = proxyAt(AFTER, "/download", { "accept-language": "en" });
  assert.equal(first.status, 307);
  assert.equal(first.headers.get("location"), "https://trytoone.com/en/download");
});

test("the funnel pages never answer with a permanent (308, browser-cached) redirect", () => {
  for (const page of ["app/[locale]/download/page.tsx", "app/[locale]/signup/page.tsx"]) {
    const source = read(page);
    assert.doesNotMatch(source, /permanentRedirect/, page);
    assert.match(source, /launchRedirect/, `${page} repeats the proxy's answer as a fallback`);
  }
});

/* ---- sitemap */

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("sitemap: the request page before the launch, open sign-up after it, never the /download redirect", async () => {
  const before = locs(await siteSitemap({ launched: false }).text());
  assert.ok(before.includes("https://trytoone.com/en/request-access"));
  assert.ok(!before.includes("https://trytoone.com/en/signup"));
  const after = locs(await (await launchedSitemap()).text());
  assert.ok(after.includes("https://trytoone.com/en/signup"));
  assert.ok(!after.some((loc) => loc.includes("/request-access")));
  for (const list of [before, after]) assert.ok(!list.some((loc) => /\/download(\?|$)/.test(loc)), "a redirect is never listed");
  assert.deepEqual(after.filter((loc) => !before.includes(loc)), ["https://trytoone.com/en/signup"], "only the funnel entry changes");
  assert.equal(siteSitemap({ launched: false }).headers.get("cache-control"), "public, max-age=300, s-maxage=300", "the pre-launch list is never kept long");
});

test("sitemap: /sitemap.xml switches to the launched list at request time", () => {
  assert.ok(config.matcher.includes("/sitemap.xml"), "the proxy runs for /sitemap.xml");
  const before = proxyAt(BEFORE, "/sitemap.xml");
  assert.equal(before.headers.get("x-middleware-rewrite"), null);
  assert.equal(before.headers.get("location"), null, "served as is, never sent to a locale");
  assert.equal(before.headers.get("x-middleware-next"), "1");
  for (const now of [AT, AFTER]) {
    assert.equal(proxyAt(now, "/sitemap.xml").headers.get("x-middleware-rewrite"), `https://trytoone.com${LAUNCHED_SITEMAP_PATH}`);
  }
  assert.ok(fs.existsSync("app/sitemap.xml/launched/route.ts"), LAUNCHED_SITEMAP_PATH);
});

/* ---- launch modal (content/announcements) */

test("the launch modal runs from the launch to the PRODUCTHUNT expiry, first in the list", () => {
  assert.equal(announcements[0], publicLaunch);
  assert.equal(Date.parse(publicLaunch.startsAt), LAUNCH_AT_MS);
  assert.equal(publicLaunch.endsAt, "2026-11-25T23:59:00Z");
  const at = (now: number, path = "/en") => activeAnnouncement(announcements, now, path)?.id ?? null;
  assert.equal(at(BEFORE), null, "nothing before the launch");
  assert.equal(at(AT), publicLaunch.id, "on at the instant");
  assert.equal(at(Date.parse("2026-11-25T23:59:00Z")), publicLaunch.id, "still on at the last minute");
  assert.equal(at(Date.parse("2026-11-25T23:59:00Z") + 1), null, "off once the code expires");
});

test("the launch modal shows on public pages only, never over sign-up, codes, downloads or checkout", () => {
  const shown = (path: string) => activeAnnouncement(announcements, AFTER, path)?.id === publicLaunch.id;
  for (const path of ["/en", "/pt", "/en/business", "/en/pricing", "/en/explore", "/en/explore/routines/x-1", "/en/guides/ai-native-company", "/en/journal/releases"]) {
    assert.ok(shown(path), path);
  }
  for (const path of ["/en/signup", "/en/signin", "/en/early-access", "/en/redeem", "/en/downloads", "/en/account", "/en/success", "/en/admin/codes"]) {
    assert.ok(!shown(path), path);
  }
});

test("the launch modal copy: Mac download, PRODUCTHUNT at €37 instead of €199.99 until Nov 25, Product Hunt link, Mac only elsewhere", () => {
  const { mac, otherPlatforms: other } = publicLaunch;
  assert.equal(mac.title, "Toone is live");
  assert.deepEqual(mac.cta, { label: "Download for Mac", href: "/download" });
  assert.equal(mac.offer?.code, "PRODUCTHUNT");
  assert.match(mac.offer?.terms ?? "", /Lifetime for €37 instead of €199\.99 with code PRODUCTHUNT, until Nov 25\./);
  assert.equal(mac.link?.href, "https://www.producthunt.com/products/toone");
  assert.equal(other.link.href, "https://www.producthunt.com/products/toone");
  assert.match(other.body, /Mac app for macOS 14 or later/);
  const copy = JSON.stringify(publicLaunch);
  assert.doesNotMatch(copy, /AppSumo|EARLYTOONE/i);
  assert.doesNotMatch(copy, /—/, "no em dashes");
  assert.doesNotMatch(copy, /\b(reliable|secure|deterministic|revolutionary|game.?chang)/i, "brand limits");
  assert.match(mac.body, /Free accounts can create 2 routines/);
});

test("the launch modal can be previewed before its window with ?preview-campaign=<id>", () => {
  assert.equal(previewAnnouncement(announcements, "public-launch-2026-11"), publicLaunch);
  assert.equal(previewAnnouncement(announcements, "nope"), null);
  const modal = read("components/announcements/AnnouncementModal.tsx");
  assert.match(modal, /params\.get\("preview-campaign"\)/);
  assert.match(modal, /launch: LaunchCard/);
});
