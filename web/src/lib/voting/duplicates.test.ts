import assert from "node:assert/strict";
import test from "node:test";

import { decideVote, voteRejectionMessage } from "./duplicates";

const base = {
  emailKey: "josh@gmail.com",
  submissionId: "design-a",
  status: "pending" as const,
  ipHash: "ip-1",
  cookieId: "cookie-1",
  fingerprintHash: "fp-1",
};

test("a new visitor can vote", () => {
  assert.deepEqual(
    decideVote([base], {
      emailKey: "sam@example.com",
      submissionId: "design-b",
      ipHash: "ip-2",
      cookieId: "cookie-2",
      fingerprintHash: "fp-2",
    }),
    { action: "create" },
  );
});

test("the same pending choice can be sent again", () => {
  assert.deepEqual(
    decideVote([base], {
      emailKey: "josh@gmail.com",
      submissionId: "design-a",
      ipHash: "ip-9",
      cookieId: "cookie-9",
      fingerprintHash: "fp-9",
    }),
    { action: "resend" },
  );
});

test("a pending email cannot switch designs", () => {
  const decision = decideVote([base], {
    emailKey: "josh@gmail.com",
    submissionId: "design-b",
    ipHash: "ip-1",
    cookieId: "cookie-1",
    fingerprintHash: "fp-1",
  });
  assert.deepEqual(decision, { action: "reject", reason: "choice-locked" });
});

test("a counted or voided email cannot vote again", () => {
  for (const status of ["counted", "void"] as const) {
    const decision = decideVote([{ ...base, status }], {
      emailKey: "josh@gmail.com",
      submissionId: "design-a",
      ipHash: null,
      cookieId: null,
      fingerprintHash: null,
    });
    assert.equal(decision.action, "reject");
    if (decision.action === "reject") {
      assert.equal(decision.reason, "already-used");
    }
  }
});

test("a different email on the same IP, cookie, or fingerprint is refused", () => {
  for (const incoming of [
    { ipHash: "ip-1", cookieId: "other", fingerprintHash: "other" },
    { ipHash: "other", cookieId: "cookie-1", fingerprintHash: "other" },
    { ipHash: "other", cookieId: "other", fingerprintHash: "fp-1" },
  ]) {
    const decision = decideVote([base], {
      emailKey: "sam@example.com",
      submissionId: "design-b",
      ...incoming,
    });
    assert.deepEqual(decision, { action: "reject", reason: "same-device" });
  }
  assert.match(voteRejectionMessage("same-device"), /device or connection/);
});

test("a voided device signal still blocks the next person", () => {
  const decision = decideVote([{ ...base, status: "void" }], {
    emailKey: "sam@example.com",
    submissionId: "design-b",
    ipHash: "ip-1",
    cookieId: "fresh",
    fingerprintHash: "fresh",
  });
  assert.deepEqual(decision, { action: "reject", reason: "same-device" });
});

test("missing signals do not collide with other missing signals", () => {
  const decision = decideVote(
    [{ ...base, ipHash: null, cookieId: null, fingerprintHash: null }],
    {
      emailKey: "sam@example.com",
      submissionId: "design-b",
      ipHash: null,
      cookieId: null,
      fingerprintHash: null,
    },
  );
  assert.deepEqual(decision, { action: "create" });
});
