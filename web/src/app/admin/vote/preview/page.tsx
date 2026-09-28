import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { PublicVote } from "@/components/PublicVote";
import { authOptions } from "@/auth";
import { listBallot, loadPollPhase } from "@/lib/voting/store";

export const dynamic = "force-dynamic";

export default async function VotePreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/signin");
  const { poll, phase } = await loadPollPhase();
  const entries = poll ? await listBallot(poll.id) : [];
  const banner =
    phase === "voting"
      ? "Admin preview. Totals stay on the full admin page."
      : phase === "results"
        ? "Admin preview of the ballot. The public homepage is showing the result."
        : "Admin preview. The public homepage is still taking submissions.";

  return (
    <PublicVote
      entries={entries}
      endsAt={poll?.endsAt ? poll.endsAt.toISOString() : null}
      preview
      banner={banner}
    />
  );
}
