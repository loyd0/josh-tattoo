import assert from "node:assert/strict";
import test from "node:test";

import { seededShuffle } from "./shuffle";

test("shuffle is a stable permutation", () => {
  const items = ["a", "b", "c", "d", "e", "f"];
  const once = seededShuffle(items, "visitor-1");
  const twice = seededShuffle(items, "visitor-1");
  assert.deepEqual(once, twice);
  assert.deepEqual([...once].sort(), [...items].sort());
  assert.deepEqual(items, ["a", "b", "c", "d", "e", "f"]);
});

test("two visitors do not get the same order", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const left = seededShuffle(items, "visitor-1");
  const right = seededShuffle(items, "visitor-2");
  assert.notDeepEqual(left, right);
});
