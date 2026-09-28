import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { AdminBallot } from "@/components/AdminBallot";
import { authOptions } from "@/auth";
import { formatLondonLocal } from "@/lib/voting/londonTime";
import {
  listAdminCandidates,
  listAdminVotes,
  loadPollPhase,
} from "@/lib/voting/store";

export const dynamic = "force-dynamic";

export default async function AdminVotePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/signin");
  const isLimited = (session.user?.role ?? "full") === "limited";
  const { poll, phase } = await loadPollPhase();
  const candidates = await listAdminCandidates({
    pollId: poll?.id ?? null,
    includeNames: !isLimited,
    includeCounts: !isLimited,
  });
  const voters = !isLimited && poll ? await listAdminVotes(poll.id) : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Voting</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Choose the tattoos on the ballot. The public page changes on its own at the start and end.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/vote/preview"
            className="rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold"
          >
            Preview
          </Link>
          <Link href="/admin" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm">
            Submissions
          </Link>
        </div>
      </div>
      <AdminBallot
        phase={phase}
        isLimited={isLimited}
        startsAtLocal={poll?.startsAt ? formatLondonLocal(poll.startsAt) : ""}
        endsAtLocal={poll?.endsAt ? formatLondonLocal(poll.endsAt) : ""}
        candidates={candidates}
        voters={
          voters?.map((vote) => ({
            id: vote.id,
            voterName: vote.voterName,
            email: vote.email,
            submissionId: vote.submissionId,
            status: vote.status,
            createdAt: vote.createdAt,
            ipHash: vote.ipHash,
            cookieId: vote.cookieId,
            fingerprintHash: vote.fingerprintHash,
            userAgent: vote.userAgent,
          })) ?? null
        }
      />
    </main>
  );
}
