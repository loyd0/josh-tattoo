export type PollPhase = "submissions" | "closed" | "voting" | "results";

export function hasEnded(endsAt: Date | null): boolean {
  return Boolean(endsAt && Date.now() >= endsAt.getTime());
}

export function pollPhase(
  now: Date,
  startsAt: Date | null,
  endsAt: Date | null,
  submissionsClosedAt: Date | null = null,
): PollPhase {
  const beforeVoting = submissionsClosedAt && now.getTime() >= submissionsClosedAt.getTime()
    ? "closed"
    : "submissions";
  if (!startsAt || !endsAt) return beforeVoting;
  if (now.getTime() < startsAt.getTime()) return beforeVoting;
  if (now.getTime() < endsAt.getTime()) return "voting";
  return "results";
}
