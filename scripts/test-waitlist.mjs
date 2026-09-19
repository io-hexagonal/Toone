// Exercise the real Next route against a controlled upstream, without creating
// production records or sending any emails. Run: node scripts/test-waitlist.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

let status = 201;
let received;
let calls = 0;
const upstream = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  calls++;
  received = { path: req.url, body: JSON.parse(body) };
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ id: "wl_test", email: "person@example.com" }));
});
await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
const port = 3129;
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(port)], {
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${upstream.address().port}/v1`, WAITLIST_UPSTREAM: "http://127.0.0.1:1/retired" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
app.stdout.on("data", (chunk) => { logs += chunk; });
app.stderr.on("data", (chunk) => { logs += chunk; });
const request = (body) => fetch(`http://localhost:${port}/api/waitlist`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body,
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await request("{}")).status === 400) { ready = true; break; } } catch {}
    if (app.exitCode !== null) throw new Error(logs);
    await delay(200);
  }
  assert(ready, "Next dev server did not become ready");
  for (const body of ["{", "null", JSON.stringify({ email: "invalid@" }), JSON.stringify({ email: "a".repeat(255) + "@example.com" })]) {
    assert.equal((await request(body)).status, 400);
  }
  assert.equal(calls, 0, "invalid requests reached the upstream");
  const valid = JSON.stringify({ email: " Person@Example.com ", source: "hero-auth" });
  const created = await request(valid);
  assert.equal(created.status, 201);
  const outcome = await created.json();
  assert.equal(outcome.outcome_state, "created");
  assert.match(outcome.outcome_id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(received, { path: "/v1/waitlist", body: { email: "person@example.com", source: "hero-auth" } });
  status = 409;
  const duplicate = await request(valid);
  assert.equal(duplicate.status, 200);
  const duplicateOutcome = await duplicate.json();
  assert.equal(duplicateOutcome.outcome_state, "already_registered");
  assert.equal(duplicateOutcome.outcome_id, undefined);
  for (const code of [400, 429, 503]) {
    status = code;
    const response = await request(valid);
    assert.equal(response.status, code === 503 ? 502 : code);
    if (code === 429) assert.equal(response.headers.get("Retry-After"), "60");
  }
  console.log("Waitlist route passed: validation, normalization, configured API, stale override ignored, creation, duplicates, rate limits, upstream failure.");
} finally {
  app.kill("SIGTERM");
  upstream.closeAllConnections();
  upstream.close();
}
