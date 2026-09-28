export type PollPhase = "submissions" | "voting" | "results";

export function hasEnded(endsAt: Date | null): boolean {
  return Boolean(endsAt && Date.now() >= endsAt.getTime());
}

export function pollPhase(
  now: Date,
  startsAt: Date | null,
  endsAt: Date | null,
): PollPhase {
  if (!startsAt || !endsAt) return "submissions";
  if (now.getTime() < startsAt.getTime()) return "submissions";
  if (now.getTime() < endsAt.getTime()) return "voting";
  return "results";
}
