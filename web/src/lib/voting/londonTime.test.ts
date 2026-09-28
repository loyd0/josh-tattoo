import assert from "node:assert/strict";
import test from "node:test";

import { formatLondonLocal, parseLondonLocal } from "./londonTime";

test("winter clock is GMT", () => {
  const parsed = parseLondonLocal("2026-01-15T12:00");
  assert.ok(parsed);
  assert.equal(parsed.toISOString(), "2026-01-15T12:00:00.000Z");
  assert.equal(formatLondonLocal(parsed), "2026-01-15T12:00");
});

test("summer clock is BST", () => {
  const parsed = parseLondonLocal("2026-07-15T12:00");
  assert.ok(parsed);
  assert.equal(parsed.toISOString(), "2026-07-15T11:00:00.000Z");
  assert.equal(formatLondonLocal(parsed), "2026-07-15T12:00");
});

test("a missing hour in the spring-forward gap is rejected", () => {
  assert.equal(parseLondonLocal("2026-03-29T01:30"), null);
});

test("junk is rejected", () => {
  assert.equal(parseLondonLocal("next thursday"), null);
  assert.equal(parseLondonLocal("2026-13-01T12:00"), null);
});
