import assert from "node:assert/strict";
import test from "node:test";
import { watchAttention, type AttentionEnv } from "../../lib/connect/attention";

/* M2: Allow arms after a moment of attention, disarms when the page loses it, and refuses a press that began earlier. */

function fakeEnv() {
  let now = 0;
  let timers: { at: number; run: () => void; id: number }[] = [];
  let next = 1;
  const page = { visible: true, focused: true };
  const win = new EventTarget();
  const doc = new EventTarget();
  const env: AttentionEnv = {
    isVisible: () => page.visible,
    hasFocus: () => page.focused,
    window: win,
    document: doc,
    now: () => now,
    setTimeout: (run, ms) => { const id = next++; timers.push({ at: now + ms, run, id }); return id; },
    clearTimeout: (id) => { timers = timers.filter((t) => t.id !== id); },
  };
  const advance = (ms: number) => {
    now += ms;
    const due = timers.filter((t) => t.at <= now);
    timers = timers.filter((t) => t.at > now);
    for (const t of due) t.run();
  };
  return { env, page, win, doc, advance };
}

test("arms only after the page has been visible and focused for the whole delay", () => {
  const { env, advance } = fakeEnv();
  const seen: boolean[] = [];
  const gate = watchAttention(env, (armed) => seen.push(armed), 1000);
  advance(999);
  assert.equal(gate.accepts(false), false);
  advance(1);
  assert.deepEqual(seen, [true]);
  assert.equal(gate.accepts(false), true, "keyboard press after arming");
  gate.stop();
});

test("blur or a hidden page disarms at once and restarts the wait", () => {
  const { env, page, win, doc, advance } = fakeEnv();
  const seen: boolean[] = [];
  const gate = watchAttention(env, (armed) => seen.push(armed), 1000);
  advance(1000);
  page.focused = false;
  win.dispatchEvent(new Event("blur"));
  assert.equal(gate.accepts(false), false);
  page.focused = true;
  win.dispatchEvent(new Event("focus"));
  advance(500);
  assert.equal(gate.accepts(false), false, "the wait starts over");
  page.visible = false;
  doc.dispatchEvent(new Event("visibilitychange"));
  advance(2000);
  assert.equal(gate.accepts(false), false, "never arms while hidden");
  page.visible = true;
  doc.dispatchEvent(new Event("visibilitychange"));
  advance(1000);
  assert.equal(gate.accepts(false), true);
  assert.deepEqual(seen, [true, false, true]);
  gate.stop();
});

test("a press whose pointer went down before Allow armed is refused; a fresh one counts", () => {
  const { env, win, advance } = fakeEnv();
  const gate = watchAttention(env, () => {}, 1000);
  advance(900);
  win.dispatchEvent(new Event("pointerdown"));
  advance(200);
  assert.equal(gate.accepts(true), false, "the double-click trick: pointer down before arming, up after");
  advance(50);
  win.dispatchEvent(new Event("pointerdown"));
  assert.equal(gate.accepts(true), true);
  gate.stop();
});

test("a page that opens without focus arms once the person moves in it", () => {
  const { env, page, win, advance } = fakeEnv();
  page.focused = false;
  const gate = watchAttention(env, () => {}, 1000);
  advance(5000);
  assert.equal(gate.accepts(false), false);
  page.focused = true;
  win.dispatchEvent(new Event("pointermove"));
  advance(1000);
  assert.equal(gate.accepts(false), true);
  gate.stop();
});
