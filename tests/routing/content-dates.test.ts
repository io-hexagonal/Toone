import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { expectedDates, historyKind, manifestDiff } from "../../scripts/content/dates-core";
import { collectSourceDates, contentDate, DATED_SOURCE_ROOTS, isDatedSource } from "../../lib/source-date";

/**
 * A2: lib/content-dates.json replaces git at build time. These tests pin the
 * shallow-clone failure it exists for, and the guard that keeps it fresh.
 */

const manifest = JSON.parse(fs.readFileSync("lib/content-dates.json", "utf8")) as Record<string, string>;

test("the manifest only dates route sources, each as YYYY-MM-DD", () => {
  assert.ok(Object.keys(manifest).length > 50);
  for (const [file, date] of Object.entries(manifest)) {
    assert.ok(isDatedSource(file), `${file} is a route source`);
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/, file);
    assert.ok(fs.existsSync(file), `${file} exists`);
  }
  for (const file of ["app/[locale]/page.tsx", "app/[locale]/privacy/page.tsx", "lib/creator-ideas.ts", "content/guides/ai-agent-governance.md"]) {
    assert.ok(manifest[file], `${file} is dated`);
  }
});

test("in a shallow clone git misdates old files; the manifest does not depend on it", (t) => {
  if (historyKind() !== "full") return t.skip("needs full history to compare");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "toone-shallow-"));
  try {
    execFileSync("git", ["clone", "-q", "--depth=1", `file://${process.cwd()}`, dir], { stdio: "ignore" });
    assert.equal(historyKind(dir), "shallow");
    const shallow = collectSourceDates(["content", "app"], dir);
    const head = execFileSync("git", ["log", "-1", "--format=%as"], { cwd: dir, encoding: "utf8" }).trim();
    // Depth 1: the single commit present "adds" every file, so git dates
    // every source to HEAD's author day, which is the deploy-day bug (audit M3).
    const older = Object.keys(manifest).filter((file) => manifest[file] < head && shallow[file]);
    assert.ok(older.length > 10, "some sources are older than HEAD");
    for (const file of older) {
      assert.equal(shallow[file], head, `${file}: shallow git says ${shallow[file]}`);
      assert.equal(contentDate(file), manifest[file], `${file}: the site still says ${manifest[file]}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a file is dated by its newest author date, whatever the log order or commit date", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "toone-dates-"));
  const git = (args: string[], env: Record<string, string> = {}) =>
    execFileSync("git", args, { cwd: dir, env: { ...process.env, ...env }, stdio: "ignore" });
  const commit = (file: string, text: string, author: string, committer: string) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
    git(["add", file]);
    git(["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", text], {
      GIT_AUTHOR_DATE: `${author}T12:00:00Z`,
      GIT_COMMITTER_DATE: `${committer}T12:00:00Z`,
    });
  };
  try {
    git(["init", "-q"]);
    // As after a rebase: the change written on 03-10 lands on top of one
    // written on 03-20, so git log lists the older-authored commit first, and
    // both commit dates are the day the rebase ran.
    commit("content/a.md", "a1", "2026-03-01", "2026-03-01");
    commit("content/a.md", "a2", "2026-03-20", "2026-04-02");
    commit("content/a.md", "a3", "2026-03-10", "2026-04-02");
    commit("content/b.md", "b1", "2026-02-05", "2026-04-02");
    assert.deepEqual(collectSourceDates(["content"], dir), {
      "content/a.md": "2026-03-20",
      "content/b.md": "2026-02-05",
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the checker reports a stale or missing date and accepts an exact match", () => {
  assert.deepEqual(manifestDiff({ a: "2026-01-01" }, { a: "2026-01-01" }), []);
  assert.deepEqual(manifestDiff({ a: "2026-01-01" }, { a: "2026-02-01" }), ["  a: manifest 2026-01-01, git 2026-02-01"]);
  assert.deepEqual(manifestDiff({}, { b: "2026-02-01" }), ["  b: manifest (missing), git 2026-02-01"]);
  assert.deepEqual(manifestDiff({ c: "2026-02-01" }, {}), ["  c: manifest 2026-02-01, git (not a dated source)"]);
});

test("an uncommitted change to a dated file counts as today", (t) => {
  if (historyKind() !== "full") return t.skip("needs full history");
  const dates = expectedDates(process.cwd(), "2099-01-01");
  const dirty = execFileSync("git", ["status", "--porcelain=v1", "--", ...DATED_SOURCE_ROOTS], { encoding: "utf8" })
    .split("\n")
    .filter((line) => line.length > 3 && !line.startsWith(" D") && !line.startsWith("D "))
    .map((line) => line.slice(3))
    .filter(isDatedSource);
  for (const file of dirty) assert.equal(dates[file], "2099-01-01", file);
  for (const [file, date] of Object.entries(dates)) {
    if (!dirty.includes(file)) assert.notEqual(date, "2099-01-01", file);
  }
});
