function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mix(state: number): number {
  let x = state >>> 0;
  x = (x + 0x6d2b79f5) >>> 0;
  let t = Math.imul(x ^ (x >>> 15), 1 | x);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (t ^ (t >>> 14)) >>> 0;
}

/** Stable per seed so a refresh does not jump the cards around. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const copy = [...items];
  let state = hashSeed(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    state = mix(state);
    const j = state % (i + 1);
    const swap = copy[i];
    copy[i] = copy[j]!;
    copy[j] = swap!;
  }
  return copy;
}
