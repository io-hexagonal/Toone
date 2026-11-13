import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fieldErrorProps } from "../../lib/field-error";
import { FOCUSABLE_SELECTOR, trappedFocusTarget } from "../../lib/focus-trap";
import { CONTRACT_ERROR_FIELD, contractRequestFrom } from "../../components/account/contract-request";
import { EMPTY_CODE_FORM, codeRequestFrom, type CodeFormState } from "../../components/admin/code-form";

/* Form errors are tied to their fields; the redemptions drawer keeps focus while it is open. */

const read = (path: string) => fs.readFileSync(path, "utf8");

test("fieldErrorProps marks the field invalid and appends the error to its description", () => {
  assert.deepEqual(fieldErrorProps(false, "err"), {});
  assert.deepEqual(fieldErrorProps(false, "err", "help"), { "aria-describedby": "help" });
  assert.deepEqual(fieldErrorProps(true, "err"), { "aria-invalid": true, "aria-describedby": "err" });
  assert.deepEqual(fieldErrorProps(true, "err", "help", undefined, false, ""), { "aria-invalid": true, "aria-describedby": "help err" });
});

test("contract form: each validation error names the input it is about, and that input exists", () => {
  const page = read("components/account/ContractRequestPage.tsx");
  for (const id of Object.values(CONTRACT_ERROR_FIELD)) assert.match(page, new RegExp(`<(input|textarea) id="${id}"`), id);
  const cases = [
    contractRequestFrom("cancel", "nope", "TOONE-ABCDEFGH12"),
    contractRequestFrom("cancel", "a@b.co", "nope"),
    contractRequestFrom("cancel", "a@b.co", "TOONE-ABCDEFGH12", "x".repeat(500)),
  ];
  assert.deepEqual(cases.map((c) => !c.ok && CONTRACT_ERROR_FIELD[c.error]), ["contract-email", "contract-order", "contract-name"]);
  // Every input carries the invalid state and keeps its help text; the error has the id they point to.
  assert.match(page, /fieldErrorProps\(errorField === "contract-email", DETAILS_ERROR_ID\)/);
  assert.match(page, /fieldErrorProps\(errorField === "contract-order", DETAILS_ERROR_ID, "contract-order-help"\)/);
  assert.match(page, /fieldErrorProps\(errorField === "contract-name", DETAILS_ERROR_ID, "contract-name-help"\)/);
  assert.match(page, /fieldErrorProps\(errorField === "contract-reason", DETAILS_ERROR_ID\)/);
  assert.match(page, /fieldErrorProps\(errorField === "contract-end-date", DETAILS_ERROR_ID, "contract-end-help"\)/);
  assert.match(page, /<p id=\{DETAILS_ERROR_ID\} className=\{styles\.error\} role="alert">/);
  assert.match(page, /document\.getElementById\(field\)\?\.focus\(\)/);
});

test("redeem form: a bad or used code marks the code input, which points at the error", () => {
  const form = read("components/account/RedeemForm.tsx");
  assert.match(form, /fieldErrorProps\(codeInvalid && Boolean\(error\), "redeem-code-error", "redeem-code-help"\)/);
  assert.match(form, /<small id="redeem-code-help">/);
  assert.match(form, /<p id="redeem-code-error" className=\{styles\.error\} role="alert">/);
  assert.match(form, /setCodeInvalid\(key === "errInvalid" \|\| key === "errUsed"\)/);
});

test("admin code form: every refusal names an input on the page, which is marked and described", () => {
  const page = read("components/admin/CodesAdminPage.tsx");
  const form = (patch: Partial<CodeFormState>): CodeFormState => ({ ...EMPTY_CODE_FORM, name: "Launch", ...patch });
  const now = Date.parse("2026-11-10T12:00:00Z");
  const refusals: Partial<CodeFormState>[] = [
    { name: " " },
    { customCode: "ab" },
    { benefit: "pro_days", benefitValue: 0 },
    { audience: "shared", maxUses: 1 },
    { days: 999 },
    { expiresAt: "2020-01-01T00:00" },
    { email: "nope" },
    { campaign: "x".repeat(81) },
  ];
  const fields = refusals.map((patch) => {
    const result = codeRequestFrom(form(patch), now);
    assert.ok(!result.ok, JSON.stringify(patch));
    return result.field;
  });
  assert.deepEqual(fields, ["recipient-name", "custom-code", "code-benefit-value", "code-max-uses", "code-expiry", "code-expires-at", "code-email", "code-campaign"]);
  for (const field of fields) {
    // The spread sits on the same element: no other input or select starts in between.
    assert.match(page, new RegExp(`id="${field}"(?:(?!<input|<select)[\\s\\S])*?\\{\\.\\.\\.invalid\\("${field}"`), field);
  }
  assert.match(page, /<p id=\{FORM_ERROR_ID\} className=\{shell\.formError\} role="alert">/);
  assert.match(page, /document\.getElementById\(result\.field\)\?\.focus\(\)/);
});

test("focus trap: Tab wraps inside the dialog and pulls stray focus back in", () => {
  const [a, b, c] = ["a", "b", "c"];
  const controls = [a, b, c];
  assert.equal(trappedFocusTarget(controls, c, false), a, "Tab on the last wraps to the first");
  assert.equal(trappedFocusTarget(controls, a, true), c, "Shift+Tab on the first wraps to the last");
  assert.equal(trappedFocusTarget(controls, b, false), null, "inside: the browser moves focus");
  assert.equal(trappedFocusTarget(controls, b, true), null);
  assert.equal(trappedFocusTarget(controls, "outside", false), a);
  assert.equal(trappedFocusTarget(controls, null, true), c);
  assert.equal(trappedFocusTarget([], a, false), null);
  assert.match(FOCUSABLE_SELECTOR, /button:not\(\[disabled\]\)/);
});

test("the redemptions drawer traps focus while open and gives it back on close", () => {
  const drawer = read("components/admin/RedemptionsDrawer.tsx");
  assert.match(drawer, /role="dialog" aria-modal="true"/);
  assert.match(drawer, /<aside ref=\{dialog\}/);
  assert.match(drawer, /const release = dialog\.current \? trapFocus\(dialog\.current\) : \(\) => \{\};\s*closeButton\.current\?\.focus\(\);/);
  assert.match(drawer, /release\(\); \};\s*\}, \[\]\);/);
  const trap = read("lib/focus-trap.ts");
  // The element focused before the drawer opened is captured first and focused again on cleanup.
  assert.match(trap, /const previous = document\.activeElement instanceof HTMLElement \? document\.activeElement : null;/);
  assert.match(trap, /if \(previous\?\.isConnected\) previous\.focus\(/);
});
