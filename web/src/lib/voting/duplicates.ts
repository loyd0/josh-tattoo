export type VoteStatus = "pending" | "counted" | "void";

export type ExistingVote = {
  emailKey: string;
  submissionId: string;
  status: VoteStatus;
  ipHash: string | null;
  cookieId: string | null;
  fingerprintHash: string | null;
};

export type IncomingVote = {
  emailKey: string;
  submissionId: string;
  ipHash: string | null;
  cookieId: string | null;
  fingerprintHash: string | null;
};

export type VoteDecision =
  | { action: "create" }
  | { action: "resend" }
  | { action: "reject"; reason: "choice-locked" | "already-used" | "same-device" };

function signalsOverlap(existing: ExistingVote, incoming: IncomingVote): boolean {
  if (incoming.ipHash && existing.ipHash && incoming.ipHash === existing.ipHash) {
    return true;
  }
  if (
    incoming.cookieId &&
    existing.cookieId &&
    incoming.cookieId === existing.cookieId
  ) {
    return true;
  }
  if (
    incoming.fingerprintHash &&
    existing.fingerprintHash &&
    incoming.fingerprintHash === existing.fingerprintHash
  ) {
    return true;
  }
  return false;
}

/** Voided rows still occupy the email and the device signals. */
export function decideVote(
  existing: ExistingVote[],
  incoming: IncomingVote,
): VoteDecision {
  const emailHit = existing.find((vote) => vote.emailKey === incoming.emailKey);
  if (emailHit) {
    if (
      emailHit.status === "pending" &&
      emailHit.submissionId === incoming.submissionId
    ) {
      return { action: "resend" };
    }
    if (emailHit.status === "pending") {
      return { action: "reject", reason: "choice-locked" };
    }
    return { action: "reject", reason: "already-used" };
  }

  const deviceHit = existing.find((vote) => signalsOverlap(vote, incoming));
  if (deviceHit) return { action: "reject", reason: "same-device" };
  return { action: "create" };
}

export function voteRejectionMessage(
  reason: "choice-locked" | "already-used" | "same-device",
): string {
  if (reason === "choice-locked") {
    return "That email already has a choice locked in. Check your inbox for the confirmation link.";
  }
  if (reason === "already-used") {
    return "That email has already been used to vote.";
  }
  return "This device or connection has already been used to vote.";
}
