import assert from "node:assert/strict";
import test from "node:test";

import { countdownParts } from "./countdown";

test("splits remaining time across day, hour, minute and second boundaries", () => {
  assert.deepEqual(countdownParts(90061000, 0), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    ended: false,
  });
  assert.deepEqual(countdownParts(86400000, 1), {
    days: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  });
});

test("counts the final partial second and stops at the exact deadline", () => {
  assert.equal(countdownParts(1000, 999).seconds, 1);
  assert.deepEqual(countdownParts(1000, 1000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: true,
  });
  assert.equal(countdownParts(1000, 2000).ended, true);
});
