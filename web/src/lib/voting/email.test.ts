import assert from "node:assert/strict";
import test from "node:test";

import { emailRejectionMessage, normalizeEmail } from "./email";

test("plus-tags fold away and googlemail matches gmail", () => {
  const a = normalizeEmail("Josh+a@Gmail.com");
  const b = normalizeEmail("josh@googlemail.com");
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  if (a.ok && b.ok) assert.equal(a.key, b.key);
  assert.equal(a.ok && a.key, "josh@gmail.com");
});

test("dots stay different people", () => {
  const dotted = normalizeEmail("j.osh@gmail.com");
  const plain = normalizeEmail("josh@gmail.com");
  assert.equal(dotted.ok && dotted.key, "j.osh@gmail.com");
  assert.equal(plain.ok && plain.key, "josh@gmail.com");
  if (dotted.ok && plain.ok) assert.notEqual(dotted.key, plain.key);
});

test("plus-tags fold on other domains too", () => {
  const normalized = normalizeEmail("Sam+vote@Outlook.com");
  assert.equal(normalized.ok && normalized.key, "sam@outlook.com");
});

test("disposable inboxes are rejected", () => {
  const result = normalizeEmail("person@mailinator.com");
  assert.deepEqual(result, { ok: false, reason: "disposable" });
  assert.match(emailRejectionMessage("disposable"), /Disposable/);
});

test("a subdomain of a disposable domain is rejected", () => {
  const result = normalizeEmail("person@inbox.mailinator.com");
  assert.deepEqual(result, { ok: false, reason: "disposable" });
});

test("junk is invalid", () => {
  assert.deepEqual(normalizeEmail("not-an-email"), { ok: false, reason: "invalid" });
  assert.deepEqual(normalizeEmail("+tag@gmail.com"), { ok: false, reason: "invalid" });
});
