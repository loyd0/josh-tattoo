export type RankedResult<T> = T & { winner: boolean };

export function rankResults<T extends { id: string; votes: number }>(
  rows: readonly T[],
): RankedResult<T>[] {
  const max = rows.reduce((highest, row) => Math.max(highest, row.votes), 0);
  return [...rows]
    .sort((a, b) => b.votes - a.votes || a.id.localeCompare(b.id))
    .map((row) => ({ ...row, winner: max > 0 && row.votes === max }));
}
