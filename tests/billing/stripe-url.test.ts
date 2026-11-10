import assert from "node:assert/strict";
import { test } from "node:test";
import { allowedStripeUrl, isAllowedStripeUrl, STRIPE_REDIRECT_HOSTS, testRedirectHosts } from "../../lib/billing/stripe-url";

test("checkout and portal URLs on the exact Stripe hosts are allowed", () => {
  assert.equal(isAllowedStripeUrl("https://checkout.stripe.com/c/pay/cs_test_a1B2#fid=x", "checkout"), true);
  assert.equal(isAllowedStripeUrl("https://checkout.stripe.com", "checkout"), true);
  assert.equal(isAllowedStripeUrl("https://checkout.stripe.com?x=1", "checkout"), true);
  assert.equal(isAllowedStripeUrl("https://billing.stripe.com/p/session/test_YWNjdA", "portal"), true);
  // Hostnames are case-insensitive; the normalized URL is what gets followed.
  assert.equal(allowedStripeUrl("https://CHECKOUT.stripe.com/c/pay/cs_1", "checkout"), "https://checkout.stripe.com/c/pay/cs_1");
});

test("each flow only accepts its own host", () => {
  assert.equal(isAllowedStripeUrl("https://billing.stripe.com/p/session/x", "checkout"), false);
  assert.equal(isAllowedStripeUrl("https://checkout.stripe.com/c/pay/x", "portal"), false);
});

const REJECTED: [string, unknown][] = [
  ["plain http", "http://checkout.stripe.com/c/pay/cs_1"],
  ["look-alike suffix", "https://checkout.stripe.com.evil.com/c/pay/cs_1"],
  ["look-alike prefix", "https://evilcheckout.stripe.com/c/pay/cs_1"],
  ["subdomain of the host", "https://x.checkout.stripe.com/c/pay/cs_1"],
  ["parent domain", "https://stripe.com/c/pay/cs_1"],
  ["other Stripe host", "https://js.stripe.com/v3"],
  ["trailing dot", "https://checkout.stripe.com./c/pay/cs_1"],
  ["userinfo trick", "https://checkout.stripe.com@evil.com/c/pay/cs_1"],
  ["userinfo before the host", "https://user:pass@checkout.stripe.com/c/pay/cs_1"],
  ["username only", "https://user@checkout.stripe.com/"],
  ["explicit port", "https://checkout.stripe.com:8443/c/pay/cs_1"],
  ["default port spelled out", "https://checkout.stripe.com:443/c/pay/cs_1"],
  ["backslash", "https://checkout.stripe.com\\@evil.com/"],
  ["encoded host", "https://checkout%2Estripe.com/"],
  ["homograph", "https://checkout.ѕtripe.com/"],
  ["scheme-relative", "//checkout.stripe.com/c/pay/cs_1"],
  ["relative path", "/c/pay/cs_1"],
  ["repaired scheme", "https:checkout.stripe.com/c/pay/cs_1"],
  ["extra slashes", "https:///checkout.stripe.com/c/pay/cs_1"],
  ["javascript", "javascript:alert(1)//checkout.stripe.com"],
  ["data URL", "data:text/html,checkout.stripe.com"],
  ["leading space", " https://checkout.stripe.com/c/pay/cs_1"],
  ["embedded tab", "https://checkout.stripe\t.com/c/pay/cs_1"],
  ["newline", "https://checkout.stripe.com/\n"],
  ["empty", ""],
  ["not a string", 42],
  ["null", null],
  ["object", { href: "https://checkout.stripe.com/" }],
];

for (const [name, url] of REJECTED) {
  test(`checkout URL rejected: ${name}`, () => {
    assert.equal(isAllowedStripeUrl(url, "checkout"), false);
    assert.equal(allowedStripeUrl(url, "checkout"), null);
  });
}

test("the allow-list is one frozen constant", () => {
  assert.deepEqual(STRIPE_REDIRECT_HOSTS, { checkout: ["checkout.stripe.com"], portal: ["billing.stripe.com"] });
  assert.equal(Object.isFrozen(STRIPE_REDIRECT_HOSTS), true);
  assert.equal(Object.isFrozen(STRIPE_REDIRECT_HOSTS.checkout), true);
  assert.equal(isAllowedStripeUrl("https://checkout.stripe.com/", "other" as never), false);
});

test("test redirect hosts apply only outside production", () => {
  const saved = { env: process.env.NODE_ENV, hosts: process.env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS };
  const env = process.env as Record<string, string | undefined>;
  try {
    env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS = "127.0.0.1:41443, bad host, fake.test";
    env.NODE_ENV = "test";
    assert.deepEqual(testRedirectHosts(), ["127.0.0.1:41443", "fake.test"]);
    assert.equal(allowedStripeUrl("https://127.0.0.1:41443/c/pay/cs_test_1", "checkout"), "https://127.0.0.1:41443/c/pay/cs_test_1");
    assert.equal(allowedStripeUrl("https://fake.test/p/session/x", "portal"), "https://fake.test/p/session/x");
    // Still https only, exact host:port, no credentials.
    assert.equal(allowedStripeUrl("http://127.0.0.1:41443/c/pay/cs_test_1", "checkout"), null);
    assert.equal(allowedStripeUrl("https://127.0.0.1:41444/c/pay/cs_test_1", "checkout"), null);
    assert.equal(allowedStripeUrl("https://u:p@127.0.0.1:41443/c/pay/cs_test_1", "checkout"), null);
    assert.equal(allowedStripeUrl("https://checkout.stripe.com.evil.com/c/pay/cs_1", "checkout"), null);

    env.NODE_ENV = "production";
    assert.deepEqual(testRedirectHosts(), []);
    assert.equal(allowedStripeUrl("https://127.0.0.1:41443/c/pay/cs_test_1", "checkout"), null);
    assert.equal(allowedStripeUrl("https://fake.test/p/session/x", "portal"), null);
    // The real hosts are unaffected either way.
    assert.equal(isAllowedStripeUrl("https://checkout.stripe.com/c/pay/cs_test_a1", "checkout"), true);

    delete env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS;
    env.NODE_ENV = "test";
    assert.deepEqual(testRedirectHosts(), []);
    assert.equal(allowedStripeUrl("https://fake.test/p/session/x", "portal"), null);
  } finally {
    env.NODE_ENV = saved.env;
    if (saved.hosts === undefined) delete env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS;
    else env.NEXT_PUBLIC_BILLING_TEST_REDIRECT_HOSTS = saved.hosts;
  }
});

