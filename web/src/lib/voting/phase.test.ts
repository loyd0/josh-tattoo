import assert from "node:assert/strict";
import test from "node:test";

import { hasEnded, pollPhase } from "./phase";

const start = new Date("2026-10-01T17:00:00.000Z");
const end = new Date("2026-10-08T17:00:00.000Z");

test("missing dates keep submissions open", () => {
  assert.equal(pollPhase(new Date(), null, null), "submissions");
  assert.equal(pollPhase(new Date(), start, null), "submissions");
});

test("before the start, submissions stay open", () => {
  assert.equal(
    pollPhase(new Date(start.getTime() - 1), start, end),
    "submissions",
  );
});

test("hasEnded is true at the end instant", () => {
  assert.equal(hasEnded(new Date(Date.now() + 60_000)), false);
  assert.equal(hasEnded(new Date(Date.now() - 1)), true);
  assert.equal(hasEnded(null), false);
});

test("the window is half-open at the end", () => {
  assert.equal(pollPhase(start, start, end), "voting");
  assert.equal(pollPhase(new Date(end.getTime() - 1), start, end), "voting");
  assert.equal(pollPhase(end, start, end), "results");
});
