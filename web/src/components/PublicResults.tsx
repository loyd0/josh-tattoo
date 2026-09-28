import { DesignLightbox } from "@/components/DesignLightbox";
import { SiteMark } from "@/components/SiteMark";
import type { RankedResult } from "@/lib/voting/results";

type ResultCard = RankedResult<{
  id: string;
  fileUrl: string;
  contentType: string;
  explanation: string | null;
  votes: number;
}>;

export function PublicResults({ entries }: { entries: ResultCard[] }) {
  const winners = entries.filter((entry) => entry.winner);
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 md:px-8">
      <header className="mb-6">
        <SiteMark />
      </header>
      <h1
        className="text-3xl font-black leading-none sm:text-4xl md:text-6xl"
        style={{ fontFamily: "Londrina Solid, cursive" }}
      >
        <span className="highlight-yellow">
          {winners.length > 1 ? "It's a tie." : winners.length === 1 ? "We have a winner." : "No votes were counted."}
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-[#333] sm:mt-4 sm:text-xl" style={{ fontFamily: "Patrick Hand, cursive" }}>
        Voting is closed. These are the counted votes.
      </p>
      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className={`rounded-2xl border-2 bg-white p-3 shadow-sm ${
              entry.winner ? "border-[#1a1a1a] ring-4 ring-[#fff176]" : "border-black/10"
            }`}
          >
            <DesignLightbox
              src={entry.fileUrl}
              alt={entry.explanation?.slice(0, 80) || "Tattoo design"}
              contentType={entry.contentType}
            />
            <p className="mt-3 text-2xl font-black" style={{ fontFamily: "Londrina Solid, cursive" }}>
              {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
              {entry.winner ? " · Winner" : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-lg text-[#333]">
              {entry.explanation?.trim() || "No explanation."}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
