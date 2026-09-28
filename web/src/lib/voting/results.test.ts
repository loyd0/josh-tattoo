import assert from "node:assert/strict";
import test from "node:test";

import { rankResults } from "./results";

test("a tie marks every design on the highest count", () => {
  const ranked = rankResults([
    { id: "c", votes: 1 },
    { id: "b", votes: 4 },
    { id: "a", votes: 4 },
  ]);
  assert.deepEqual(
    ranked.map((row) => ({ id: row.id, votes: row.votes, winner: row.winner })),
    [
      { id: "a", votes: 4, winner: true },
      { id: "b", votes: 4, winner: true },
      { id: "c", votes: 1, winner: false },
    ],
  );
});

test("zero votes produces no winner", () => {
  const ranked = rankResults([
    { id: "b", votes: 0 },
    { id: "a", votes: 0 },
  ]);
  assert.equal(ranked.every((row) => !row.winner), true);
  assert.deepEqual(
    ranked.map((row) => row.id),
    ["a", "b"],
  );
});
