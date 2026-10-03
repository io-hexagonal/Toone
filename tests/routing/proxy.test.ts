import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import proxy from "../../proxy";

function run(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(new URL(path, "https://trytoone.com"), { headers }));
}

const GOOGLEBOT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function assertRedirect(
  response: Response,
  status: number,
  location: string,
  message?: string,
) {
  assert.equal(response.status, status, message);
  assert.equal(response.headers.get("location"), location, message);
}

/** A cookie-dependent answer is never stored and says what it varies on. */
function assertPerVisitor(response: Response, vary: string, message?: string) {
  assert.equal(response.headers.get("cache-control"), "private, no-store", message);
  assert.equal(response.headers.get("vary"), vary, message);
}

test("R6: the root is a permanent 308 to /en for anyone without an explicit choice", () => {
  for (const [label, headers] of [
    ["no headers", {}],
    ["Accept-Language pt-BR", { "accept-language": "pt-BR,pt;q=0.9" }],
    ["Googlebot", { "user-agent": GOOGLEBOT, "accept-language": "pt-BR" }],
    ["choice en", { cookie: "toone_locale=en" }],
    ["unsupported choice", { cookie: "toone_locale=zz" }],
    ["next-intl cookie only", { cookie: "NEXT_LOCALE=pt" }],
  ] as const) {
    const response = run("/", headers);
    assertRedirect(response, 308, "https://trytoone.com/en", label);
    assertPerVisitor(response, "Cookie", label);
  }
});

test("the root honours an explicit non-English choice with a 307, query kept", () => {
  const response = run("/?utm_source=x", { cookie: "toone_locale=pt", "accept-language": "de" });
  assertRedirect(response, 307, "https://trytoone.com/pt?utm_source=x");
  assertPerVisitor(response, "Cookie");
});

test("/explore follows the root rule", () => {
  assertRedirect(run("/explore?ref=x", { "accept-language": "pt-BR" }), 308, "https://trytoone.com/en/explore?ref=x");
  const chosen = run("/explore", { cookie: "toone_locale=fr" });
  assertRedirect(chosen, 307, "https://trytoone.com/fr/explore");
  assertPerVisitor(chosen, "Cookie");
});

test("link-preview bots get the English page at the root, not a redirect", () => {
  const response = run("/", { "user-agent": "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" });
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("x-middleware-rewrite"), "https://trytoone.com/en");
});

test("English-only routes are one 308 to /en, query kept, from any language or prefix", () => {
  for (const [path, location] of [
    ["/privacy?utm_source=x", "https://trytoone.com/en/privacy?utm_source=x"],
    ["/pt/terms", "https://trytoone.com/en/terms"],
    ["/pt/terms?utm_source=x", "https://trytoone.com/en/terms?utm_source=x"],
    ["/de/about", "https://trytoone.com/en/about"],
    ["/governance", "https://trytoone.com/en/governance"],
    ["/ru/editorial-policy", "https://trytoone.com/en/editorial-policy"],
    ["/contact", "https://trytoone.com/en/contact"],
    ["/fr/how-to/features/routines", "https://trytoone.com/en/how-to/features/routines"],
    ["/journal", "https://trytoone.com/en/journal"],
    ["/pt/journal/releases?page=2", "https://trytoone.com/en/journal/releases?page=2"],
  ]) {
    for (const headers of [{}, { "accept-language": "pt-BR" }, { cookie: "toone_locale=de" }] as Record<string, string>[]) {
      assertRedirect(run(path, headers), 308, location, `${path} ${JSON.stringify(headers)}`);
    }
  }
});

test("English-only routes under /en, or an unknown prefix, are not redirected here", () => {
  for (const path of ["/en/privacy", "/en/journal", "/en/how-to/features/routines"]) {
    const response = run(path, { "accept-language": "pt-BR", cookie: "toone_locale=pt" });
    assert.equal(response.headers.get("location"), null, path);
  }
  assert.notEqual(run("/zz/privacy").headers.get("location"), "https://trytoone.com/en/privacy");
});

test("unprefixed How-to paths are one 308 to English, whatever the language", () => {
  for (const [path, location] of [
    ["/how-to", "https://trytoone.com/en/how-to"],
    ["/how-to/features/routines", "https://trytoone.com/en/how-to/features/routines"],
    ["/how-to/getting-started?ref=x", "https://trytoone.com/en/how-to/getting-started?ref=x"],
  ]) {
    for (const language of ["", "pt-BR"]) {
      const response = run(path, language ? { "accept-language": language } : {});
      assert.equal(response.status, 308, `${path} (${language || "none"})`);
      assert.equal(response.headers.get("location"), location);
    }
  }
});

test("other unprefixed paths follow an explicit choice first, then Accept-Language", () => {
  const chosen = run("/downloads?ref=x", { cookie: "toone_locale=de", "accept-language": "pt-BR" });
  assertRedirect(chosen, 307, "https://trytoone.com/de/downloads?ref=x");
  assertPerVisitor(chosen, "Cookie, Accept-Language");

  const english = run("/downloads", { cookie: "toone_locale=en", "accept-language": "pt-BR" });
  assertRedirect(english, 307, "https://trytoone.com/en/downloads");

  const negotiated = run("/downloads", { "accept-language": "pt-BR" });
  assertRedirect(negotiated, 307, "https://trytoone.com/pt/downloads");
  assertPerVisitor(negotiated, "Cookie, Accept-Language");
  assert.equal(negotiated.headers.get("set-cookie"), null);

  assertRedirect(run("/downloads", { cookie: "NEXT_LOCALE=pt" }), 307, "https://trytoone.com/en/downloads");
  assertRedirect(run("/downloads", { cookie: "toone_locale=zz" }), 307, "https://trytoone.com/en/downloads");
});

test("locale-prefixed URLs are never redirected by preference, and nothing sets a cookie", () => {
  for (const [path, headers] of [
    ["/pt", { cookie: "toone_locale=en" }],
    ["/en", { cookie: "toone_locale=pt" }],
    ["/en", { "accept-language": "pt-BR" }],
    ["/en", { "accept-language": "pt-BR", "sec-fetch-dest": "document" }],
    ["/de/downloads", { cookie: "toone_locale=fr", "accept-language": "it" }],
  ] as const) {
    const response = run(path, headers);
    const label = `${path} ${JSON.stringify(headers)}`;
    assert.equal(response.status, 200, label);
    assert.equal(response.headers.get("location"), null, label);
    assert.equal(response.headers.get("set-cookie"), null, label);
  }
});

test("unprefixed AI digest paths are served by the 410 route, not redirected", () => {
  for (const [path, rewrite] of [
    ["/ai-digest", "https://trytoone.com/en/ai-digest"],
    ["/ai-digest/some-post", "https://trytoone.com/en/ai-digest/some-post"],
  ]) {
    for (const headers of [{}, { cookie: "toone_locale=pt" }] as Record<string, string>[]) {
      const response = run(path, headers);
      assert.equal(response.headers.get("location"), null, path);
      assert.equal(response.headers.get("x-middleware-rewrite"), rewrite, path);
    }
  }
});

test("paths that only start like How-to or AI digest are left to next-intl", () => {
  for (const path of ["/how-tos", "/ai-digests", "/privacy-notice"]) {
    const response = run(path);
    assert.notEqual(response.status, 308, path);
    assert.equal(response.headers.get("x-middleware-rewrite"), null, path);
  }
});
