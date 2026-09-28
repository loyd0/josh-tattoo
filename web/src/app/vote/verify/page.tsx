import Image from "next/image";

import { ConfirmVoteButton, ResendVoteForm } from "@/components/ConfirmVote";
import { SiteMark } from "@/components/SiteMark";
import { hasEnded } from "@/lib/voting/phase";
import { findVoteByTokenHash } from "@/lib/voting/store";
import { hashToken } from "@/lib/voting/token";

export const dynamic = "force-dynamic";

export default async function VerifyVotePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim() ?? "";
  const vote = token ? await findVoteByTokenHash(hashToken(token)) : null;
  const closed = hasEnded(vote?.endsAt ?? null);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <SiteMark />
      <h1
        className="mt-6 text-4xl font-black"
        style={{ fontFamily: "Londrina Solid, cursive" }}
      >
        Confirm your vote
      </h1>
      {!vote ? (
        <>
          <p className="mt-4 text-xl">
            That link is not valid. If your choice is still waiting, ask for the email again.
          </p>
          <ResendVoteForm />
        </>
      ) : vote.status === "void" ? (
        <p className="mt-4 text-xl">This vote has been removed and will not count.</p>
      ) : vote.status === "counted" ? (
        <p className="mt-4 text-xl">Your vote is already counted.</p>
      ) : closed ? (
        <>
          <p className="mt-4 text-xl">
            Voting has closed, so this vote was not counted.
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-xl">
            {vote.voterName}, this is the design you locked in. Press the button to count it.
            You cannot change it.
          </p>
          <article className="mt-6 rounded-2xl border-2 border-[#1a1a1a] bg-white p-3">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f0e6]">
              {vote.contentType.startsWith("image/") ? (
                <Image
                  src={vote.fileUrl}
                  alt={vote.explanation?.slice(0, 80) || "Tattoo design"}
                  fill
                  className="object-contain"
                  sizes="480px"
                />
              ) : (
                <a href={vote.fileUrl} className="flex h-full items-center justify-center underline">
                  Open this design
                </a>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-lg">
              {vote.explanation?.trim() || "No explanation."}
            </p>
          </article>
          <ConfirmVoteButton token={token} />
          <p className="mt-8 text-lg">Email not working?</p>
          <ResendVoteForm />
        </>
      )}
    </main>
  );
}
