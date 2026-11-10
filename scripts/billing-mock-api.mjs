#!/usr/bin/env node
/**
 * Local mock of the Toone Pro billing API, so the pricing, success, account,
 * redeem and admin code pages can be built without the real server or Stripe:
 *
 *   npm run billing:mock
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8788/v1 npm run dev
 *
 * No dependencies. Every success is wrapped in {data}; errors are
 * {code, message}. Any email and password sign in (POST /v1/auth/email/login);
 * every bearer token is accepted unless the scenario is "signed_out".
 *
 * Scenarios (BILLING_MOCK_SCENARIO, or POST /__test/scenario {"scenario": "…"}):
 *   free            free plan, 1 of 2 creations used, every feature on (default)
 *   pro_stripe      yearly Stripe subscription, managed in the Customer Portal
 *   pro_lifetime    Stripe lifetime purchase
 *   pro_app_store   monthly App Store subscription, managed by Apple
 *   pro_code        Pro for 30 days from a redeemed code
 *   payments_off    checkout and portal flags off, those routes answer 503
 *   codes_off       code flag off, code routes answer 503
 *   signed_out      every signed-in route answers 401
 *   future_enums    entitlement and prices carry values this site does not know yet
 *
 * Codes (POST /v1/me/codes/check|redeem, /v1/auth/invite/check), any scenario:
 *   PRO30 (30 days of Pro) · LIFETIME (Pro for good) · PLUS3 (3 more creations)
 *   INVALID → invalid_invitation · USED → code_already_redeemed
 *   VERIFY → email_verification_required · LIMIT → rate_limit_exceeded
 *   A code redeemed once answers code_already_redeemed afterwards.
 *
 * Checkout: POST /v1/billing/checkout returns a checkout.stripe.com URL that
 * does not exist. Instead, open /__mock/complete?session_id=… on this server:
 * it marks the session paid and redirects to the site's success page. A
 * session also completes by itself after BILLING_MOCK_COMPLETE_MS (default
 * 4000, 0 = never), as a late webhook would. /__mock/expire?session_id=…
 * expires it unpaid.
 *
 * Test hooks: POST /__test/scenario {"scenario", "delayMs"?}, POST /__test/reset,
 * GET /__test/state.
 *
 * Env: PORT (default 8788), BILLING_MOCK_SITE (default http://localhost:3000),
 * BILLING_MOCK_SCENARIO, BILLING_MOCK_COMPLETE_MS.
 */
import http from "node:http";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCENARIOS = [
  "free", "pro_stripe", "pro_lifetime", "pro_app_store", "pro_code",
  "payments_off", "codes_off", "signed_out", "future_enums",
];

const CODES = {
  PRO30: { kind: "pro_days", value: 30 },
  LIFETIME: { kind: "pro_lifetime" },
  PLUS3: { kind: "free_creations", value: 3 },
};

const CODE_ERRORS = {
  INVALID: [403, "invalid_invitation", "invitation is invalid, expired, used, or belongs to a different email"],
  USED: [409, "code_already_redeemed", "this account already redeemed this code"],
  VERIFY: [403, "email_verification_required", "confirm your email address to use this code"],
  LIMIT: [429, "rate_limit_exceeded", "too many attempts; try again in a minute"],
};

const DAY = 24 * 60 * 60 * 1000;

const PRICES = [
  { plan: "pro_monthly", interval: "month", amount: 900, currency: "eur", display_price: "€9", tax_inclusive: true },
  { plan: "pro_yearly", interval: "year", amount: 7900, currency: "eur", display_price: "€79", tax_inclusive: true },
  { plan: "pro_lifetime", interval: null, amount: 19900, currency: "eur", display_price: "€199", tax_inclusive: true },
];

function iso(ms) {
  return new Date(ms).toISOString();
}

function freshAccount(scenario, now = Date.now()) {
  const base = {
    plan: "free", source: null, product_id: null, status: null, expires_at: null, will_renew: null,
    billing_provider: null, manage: null, plan_interval: null,
    used: 1, bonus: 0, email_verification_required: false,
  };
  switch (scenario) {
    case "pro_stripe":
      return { ...base, plan: "pro", source: "subscription", status: "active", product_id: "pro_yearly",
        expires_at: iso(now + 365 * DAY), will_renew: true, billing_provider: "stripe", manage: "stripe_portal", plan_interval: "year" };
    case "pro_lifetime":
      return { ...base, plan: "pro", source: "lifetime", status: "active", product_id: "pro_lifetime",
        billing_provider: "stripe", manage: "stripe_portal", plan_interval: "lifetime" };
    case "pro_app_store":
      return { ...base, plan: "pro", source: "subscription", status: "active", product_id: "app.toone.pro.monthly",
        expires_at: iso(now + 30 * DAY), will_renew: true, billing_provider: "app_store", manage: "app_store", plan_interval: "month" };
    case "pro_code":
      return { ...base, plan: "pro", source: "grant", status: "active", expires_at: iso(now + 30 * DAY),
        will_renew: false, billing_provider: "toone" };
    case "future_enums":
      return { ...base, plan: "pro", source: "partner", status: "paused", billing_provider: "paddle",
        manage: "paddle_portal", plan_interval: "quarter" };
    default:
      return base;
  }
}

/** A mock server; `listen()` it yourself (tests use port 0). */
export function createBillingMock(options = {}) {
  const site = (options.site ?? process.env.BILLING_MOCK_SITE ?? "http://localhost:3000").replace(/\/$/, "");
  const completeMs = Number(options.completeMs ?? process.env.BILLING_MOCK_COMPLETE_MS ?? 4000);
  const quiet = options.quiet ?? false;
  let state;

  function reset(scenario = options.scenario ?? process.env.BILLING_MOCK_SCENARIO ?? "free") {
    if (!SCENARIOS.includes(scenario)) throw new Error(`unknown scenario ${scenario}`);
    state = {
      scenario,
      delayMs: 0,
      account: freshAccount(scenario),
      sessions: new Map(),
      redeemed: new Set(),
      invitations: [
        { id: "inv_mock_1", recipient_name: "Launch campaign", code_hint: "PRO3…", status: "pending", email: "",
          user_id: "", account_name: "", created_at: iso(Date.now() - 7 * DAY), expires_at: iso(Date.now() + 23 * DAY),
          used_at: null, max_uses: 100, use_count: 2, benefit: { kind: "pro_days", value: 30 }, admits_signup: false,
          campaign: "launch", created_by: "usr_admin" },
      ],
      redemptions: {
        inv_mock_1: [
          { id: "red_mock_2", user_id: "usr_b", email: "b@example.com", account_name: "B", channel: "website",
            benefit: { kind: "pro_days", value: 30 }, redeemed_at: iso(Date.now() - DAY) },
          { id: "red_mock_1", user_id: "usr_a", email: "a@example.com", account_name: "A", channel: "desktop",
            benefit: { kind: "pro_days", value: 30 }, redeemed_at: iso(Date.now() - 2 * DAY) },
        ],
      },
      counter: 0,
    };
  }
  reset();

  const flag = {
    checkout: () => state.scenario !== "payments_off",
    portal: () => state.scenario !== "payments_off",
    codes: () => state.scenario !== "codes_off",
  };

  function entitlement() {
    const a = state.account;
    const body = {
      plan: a.plan, source: a.source, product_id: a.product_id, status: a.status, expires_at: a.expires_at,
      will_renew: a.will_renew, app_account_token: "00000000-0000-4000-8000-000000000000",
      free_routine_creations: { used: a.used, limit: 2 + a.bonus },
      guest_passes: null, guest_of: null, email_verification_required: a.email_verification_required,
    };
    // Optional fields are omitted (not null) when unset, as an older server would.
    for (const key of ["billing_provider", "manage", "plan_interval"]) if (a[key] !== null) body[key] = a[key];
    return body;
  }

  function activate(session) {
    if (session.status !== "open") return;
    session.status = "complete";
    const lifetime = session.plan === "pro_lifetime";
    Object.assign(state.account, {
      plan: "pro", source: lifetime ? "lifetime" : "subscription", status: "active", product_id: session.plan,
      expires_at: lifetime ? null : iso(Date.now() + (session.plan === "pro_yearly" ? 365 : 30) * DAY),
      will_renew: lifetime ? null : true, billing_provider: "stripe", manage: "stripe_portal",
      plan_interval: lifetime ? "lifetime" : session.plan === "pro_yearly" ? "year" : "month",
    });
  }

  function send(res, status, body) {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(body === undefined ? "" : JSON.stringify(body));
  }
  const ok = (res, data, status = 200) => send(res, status, { data });
  const fail = (res, status, code, message, extra = {}) => send(res, status, { code, message, ...extra });

  async function readJSON(req) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function signedIn(req, res) {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ") || state.scenario === "signed_out") {
      fail(res, 401, "unauthorized", "authentication required");
      return false;
    }
    return true;
  }

  function codeOutcome(res, rawCode, redeem) {
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    if (CODE_ERRORS[code]) {
      const [status, errorCode, message] = CODE_ERRORS[code];
      fail(res, status, errorCode, message);
      return null;
    }
    const benefit = CODES[code];
    if (!benefit) {
      fail(res, 403, ...CODE_ERRORS.INVALID.slice(1));
      return null;
    }
    if (redeem && state.redeemed.has(code)) {
      fail(res, 409, ...CODE_ERRORS.USED.slice(1));
      return null;
    }
    return { code, benefit };
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const p = url.pathname.replace(/\/$/, "") || "/";
    const method = req.method ?? "GET";
    if (!quiet) console.log(`[billing-mock] ${method} ${url.pathname}${url.search} (${state.scenario})`);

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
      });
      return res.end();
    }

    /* ---- test hooks */
    if (p === "/__test/scenario" && method === "POST") {
      const body = (await readJSON(req)) ?? {};
      try {
        reset(body.scenario ?? state.scenario);
      } catch (error) {
        return fail(res, 400, "invalid_input", error.message);
      }
      state.delayMs = Math.min(Number(body.delayMs) || 0, 10_000);
      return ok(res, { scenario: state.scenario, delayMs: state.delayMs });
    }
    if (p === "/__test/reset" && method === "POST") {
      reset();
      return ok(res, { scenario: state.scenario });
    }
    if (p === "/__test/state" && method === "GET") {
      return ok(res, { scenario: state.scenario, entitlement: entitlement(), sessions: [...state.sessions.values()] });
    }
    if ((p === "/__mock/complete" || p === "/__mock/expire") && method === "GET") {
      const session = state.sessions.get(url.searchParams.get("session_id") ?? "");
      if (!session) return fail(res, 404, "not_found", "unknown checkout session");
      if (p === "/__mock/complete") activate(session);
      else if (session.status === "open") session.status = "expired";
      const target = p === "/__mock/complete"
        ? `${site}/${session.locale}/success?session_id=${encodeURIComponent(session.id)}`
        : `${site}/${session.locale}/cancel`;
      res.writeHead(302, { Location: target });
      return res.end();
    }

    if (state.delayMs) await new Promise((resolve) => setTimeout(resolve, state.delayMs));

    /* ---- public */
    if (p === "/v1/capabilities" && method === "GET") {
      return ok(res, {
        schema_version: 1,
        features: {
          payments: flag.checkout(), toone_pro: true,
          stripe_pro_checkout: flag.checkout(), billing_portal: flag.portal(), pro_codes: flag.codes(),
        },
        contracts: { business_context: 0, live_share: 0, payments: flag.checkout() ? 2 : 0 },
        legacy_contracts: [],
      });
    }
    if (p === "/v1/billing/prices" && method === "GET") {
      const prices = state.scenario === "future_enums"
        ? [...PRICES, { plan: "pro_team", interval: "month", amount: 2900, currency: "eur", display_price: "€29", tax_inclusive: true }]
        : PRICES;
      return ok(res, prices);
    }
    if (p === "/v1/billing/contract-requests" && method === "POST") {
      const body = await readJSON(req);
      if (!body || !["withdraw", "cancel"].includes(body.kind) || typeof body.email !== "string" || !body.email.includes("@")) {
        return fail(res, 400, "invalid_input", "invalid request");
      }
      return ok(res, { status: "sent" }, 202);
    }
    if (p === "/v1/auth/invite/check" && method === "POST") {
      const body = (await readJSON(req)) ?? {};
      const outcome = codeOutcome(res, body.code, false);
      if (!outcome) return;
      return ok(res, { valid: true, shared: true, label: "Mock code", expires_at: iso(Date.now() + 30 * DAY),
        benefit: outcome.benefit, admits_signup: false });
    }

    /* ---- minimal sign-in so pages can be used locally */
    if (p === "/v1/auth/email/login" && method === "POST") {
      const body = (await readJSON(req)) ?? {};
      const email = typeof body.email === "string" && body.email ? body.email : "you@example.com";
      const now = Date.now();
      return ok(res, {
        User: { ID: "usr_mock", Email: email, Name: "Mock User", Handle: "" },
        Session: { UserID: "usr_mock", Token: `mock_${randomBytes(8).toString("hex")}`, ExpiresAt: iso(now + 7 * DAY), IssuedAt: iso(now) },
      });
    }
    if (p === "/v1/auth/logout" && method === "POST") return send(res, 204);

    /* ---- signed in */
    if (!p.startsWith("/v1/")) return fail(res, 404, "not_found", "not found");
    if (!signedIn(req, res)) return;

    if (p === "/v1/me" && method === "GET") {
      return ok(res, { ID: "usr_mock", Email: "you@example.com", Name: "Mock User", Handle: "" });
    }
    if (p === "/v1/me/capabilities" && method === "GET") {
      return ok(res, { capabilities: ["invitation.manage"] });
    }
    if (p === "/v1/me/entitlement" && method === "GET") return ok(res, entitlement());

    if (p === "/v1/billing/checkout" && method === "POST") {
      if (!flag.checkout()) return fail(res, 503, "service_unavailable", "service temporarily unavailable");
      const body = await readJSON(req);
      if (!body || !PRICES.some((price) => price.plan === body.plan) || typeof body.locale !== "string") {
        return fail(res, 400, "invalid_input", "invalid request");
      }
      if (state.account.plan === "pro" && state.account.source !== "guest") {
        return fail(res, 409, "already_pro", "this person already has Toone Pro", { source: state.account.source });
      }
      const id = `cs_test_mock_${++state.counter}`;
      const session = { id, plan: body.plan, locale: body.locale || "en", return: body.return, status: "open" };
      state.sessions.set(id, session);
      if (completeMs > 0) setTimeout(() => activate(session), completeMs).unref();
      return ok(res, { checkout_url: `https://checkout.stripe.com/c/pay/${id}`, session_id: id });
    }
    const status = p.match(/^\/v1\/billing\/checkout\/([^/]+)$/);
    if (status && method === "GET") {
      const session = state.sessions.get(decodeURIComponent(status[1]));
      if (!session) return fail(res, 404, "not_found", "resource not found");
      return ok(res, { status: session.status, entitled: session.status === "complete" && state.account.plan === "pro" });
    }
    if (p === "/v1/billing/portal" && method === "POST") {
      if (!flag.portal()) return fail(res, 503, "service_unavailable", "service temporarily unavailable");
      if (state.account.billing_provider !== "stripe") return fail(res, 404, "not_found", "resource not found");
      return ok(res, { url: `https://billing.stripe.com/p/session/test_mock_${randomBytes(4).toString("hex")}` });
    }

    const codeRoute = p.match(/^\/v1\/me\/codes\/(check|redeem)$/);
    if (codeRoute && method === "POST") {
      if (!flag.codes()) return fail(res, 503, "service_unavailable", "service temporarily unavailable");
      const redeem = codeRoute[1] === "redeem";
      const body = (await readJSON(req)) ?? {};
      const outcome = codeOutcome(res, body.code, redeem);
      if (!outcome) return;
      const grantsPro = outcome.benefit.kind !== "free_creations";
      if (grantsPro && state.account.plan === "pro") {
        return fail(res, 409, "already_pro", "this person already has Toone Pro", { source: state.account.source });
      }
      if (redeem) {
        state.redeemed.add(outcome.code);
        if (outcome.benefit.kind === "free_creations") state.account.bonus += outcome.benefit.value;
        else {
          const lifetime = outcome.benefit.kind === "pro_lifetime";
          Object.assign(state.account, {
            plan: "pro", source: "grant", status: "active", billing_provider: "toone", manage: null, plan_interval: null,
            expires_at: lifetime ? null : iso(Date.now() + outcome.benefit.value * DAY), will_renew: false,
          });
        }
      }
      return ok(res, { benefit: outcome.benefit, entitlement: entitlement() });
    }

    /* ---- admin */
    if (p === "/v1/admin/invitations" && method === "GET") return ok(res, state.invitations);
    if (p === "/v1/admin/invitations" && method === "POST") {
      const body = await readJSON(req);
      if (!body || typeof body.code !== "string" || !body.code.trim() || typeof body.days !== "number") {
        return fail(res, 400, "invalid_input", "invalid request");
      }
      const id = `inv_mock_${state.invitations.length + 1}`;
      const benefit = body.benefit ?? { kind: "none" };
      const expires = iso(Date.now() + body.days * DAY);
      state.invitations.unshift({
        id, recipient_name: body.recipient_name ?? "", code_hint: `${body.code.slice(0, 4)}…`, status: "pending",
        email: body.email ?? "", user_id: "", account_name: "", created_at: iso(Date.now()), expires_at: expires,
        used_at: null, max_uses: body.max_uses ?? 1, use_count: 0, benefit, admits_signup: body.admits_signup !== false,
        campaign: body.campaign ?? "", created_by: "usr_mock",
      });
      state.redemptions[id] = [];
      return ok(res, {
        id, recipient_name: body.recipient_name ?? "", code: body.code, expires_at: expires, max_uses: body.max_uses ?? 1,
        signup_url: `${site}/invite#code=${encodeURIComponent(body.code)}`, email_queued: false,
        benefit, admits_signup: body.admits_signup !== false, campaign: body.campaign ?? "",
      }, 201);
    }
    const admin = p.match(/^\/v1\/admin\/invitations\/([^/]+)(\/redemptions)?$/);
    if (admin) {
      const id = decodeURIComponent(admin[1]);
      const invitation = state.invitations.find((item) => item.id === id);
      if (!invitation) return fail(res, 404, "not_found", "resource not found");
      if (admin[2] && method === "GET") {
        const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
        const all = state.redemptions[id] ?? [];
        return ok(res, { entries: all.slice(offset, offset + limit), has_more: offset + limit < all.length, limit });
      }
      if (!admin[2] && method === "DELETE") {
        invitation.status = "revoked";
        return send(res, 204);
      }
    }

    return fail(res, 404, "not_found", "not found");
  });

  return {
    server,
    reset,
    get state() {
      return state;
    },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 8788);
  const mock = createBillingMock();
  mock.server.listen(port, "127.0.0.1", () => {
    console.log(`[billing-mock] http://localhost:${port}/v1  (NEXT_PUBLIC_API_BASE_URL=http://localhost:${port}/v1)`);
    console.log(`[billing-mock] scenario ${mock.state.scenario}; scenarios: ${SCENARIOS.join(", ")}`);
  });
}
