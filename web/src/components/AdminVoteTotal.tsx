"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AdminVoteTotal({ total }: { total: number }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  return (
    <section
      aria-label="Total confirmed votes"
      className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border-2 border-[#1a1a1a]/20 bg-[#fff176]/40 p-5 sm:p-6"
    >
      <div>
        <p className="text-lg font-semibold text-zinc-900">
          Total confirmed votes
        </p>
        <p
          role="status"
          aria-live="polite"
          className="my-2 text-6xl leading-none font-black text-zinc-900 tabular-nums"
          style={{ fontFamily: "Londrina Solid, cursive" }}
        >
          {total.toLocaleString("en-GB")}
        </p>
        <p className="max-w-lg text-base text-zinc-700">
          Only email-confirmed votes count. Pending and voided votes are
          excluded.
        </p>
      </div>
      <button
        type="button"
        disabled={refreshing}
        onClick={() => startTransition(() => router.refresh())}
        className="min-h-11 rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3b4cca] disabled:opacity-60"
      >
        {refreshing ? "Refreshing…" : "Refresh total"}
      </button>
    </section>
  );
}
