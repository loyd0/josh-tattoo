"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Candidate = {
  id: string;
  explanation: string | null;
  fileUrl: string;
  contentType: string;
  name: string | null;
  selected: boolean;
  voteCount: number | null;
};

type Voter = {
  id: string;
  voterName: string;
  email: string;
  submissionId: string;
  status: string;
  createdAt: string;
  ipHash: string | null;
  cookieId: string | null;
  fingerprintHash: string | null;
  userAgent: string | null;
};

export function AdminBallot({
  phase,
  isLimited,
  startsAtLocal,
  endsAtLocal,
  candidates,
  voters,
}: {
  phase: "submissions" | "voting" | "results";
  isLimited: boolean;
  startsAtLocal: string;
  endsAtLocal: string;
  candidates: Candidate[];
  voters: Voter[] | null;
}) {
  const [rows, setRows] = useState(candidates);
  const [start, setStart] = useState(startsAtLocal);
  const [end, setEnd] = useState(endsAtLocal);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [voteRows, setVoteRows] = useState(voters ?? []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...rows]
      .filter((row) => {
        if (!needle) return true;
        const haystack = `${row.name ?? ""} ${row.explanation ?? ""}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => Number(b.selected) - Number(a.selected));
  }, [rows, query]);

  async function toggle(row: Candidate) {
    const next = !row.selected;
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, selected: next } : item)),
    );
    const res = await fetch("/api/admin/poll/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: row.id, selected: next }),
    });
    if (!res.ok) {
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, selected: row.selected } : item)),
      );
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(json?.error ?? "Could not update the ballot.");
    }
  }

  async function saveDates(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/poll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAtLocal: start, endsAtLocal: end }),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    setMessage(res.ok ? "Dates saved. Times are UK local time." : (json?.error ?? "Could not save dates."));
  }

  async function voidRow(id: string) {
    const res = await fetch(`/api/admin/votes/${id}/void`, { method: "POST" });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(json?.error ?? "Could not void that vote.");
      return;
    }
    setVoteRows((current) =>
      current.map((vote) => (vote.id === id ? { ...vote, status: "void" } : vote)),
    );
  }

  const phaseLabel =
    phase === "voting"
      ? "Voting is open. The homepage is the ballot."
      : phase === "results"
        ? "Voting has ended. The homepage shows the result."
        : "The public homepage is still taking submissions.";

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-700">{phaseLabel}</p>
      {message ? <p className="text-sm text-zinc-800">{message}</p> : null}

      {isLimited ? (
        <p className="text-sm text-zinc-600">
          You can choose designs and preview the ballot. Dates, totals, and voter details stay with the full admin.
        </p>
      ) : (
        <form onSubmit={saveDates} className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-700">
            Start (UK)
            <input
              type="datetime-local"
              required
              value={start}
              onChange={(event) => setStart(event.target.value)}
              disabled={phase !== "submissions"}
              className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-zinc-700">
            End (UK)
            <input
              type="datetime-local"
              required
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save dates
          </button>
        </form>
      )}

      <div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isLimited ? "Search explanations" : "Search name or explanation"}
          className="mb-3 w-full max-w-md rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((row) => (
            <label
              key={row.id}
              className={`block rounded-xl border p-3 ${row.selected ? "border-zinc-900 bg-amber-50" : "border-zinc-200 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={() => void toggle(row)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-zinc-100">
                    {row.contentType.startsWith("image/") ? (
                      <Image
                        src={row.fileUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-zinc-500">
                        File
                      </span>
                    )}
                  </div>
                  {row.name ? <div className="text-sm font-medium">{row.name}</div> : null}
                  <p className="line-clamp-3 text-sm text-zinc-700">
                    {row.explanation?.trim() || "No explanation."}
                  </p>
                  {row.voteCount !== null ? (
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {row.voteCount} counted
                    </p>
                  ) : null}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {voteRows.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-600">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Signals</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {voteRows.map((vote) => (
                <tr key={vote.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {vote.createdAt ? new Date(vote.createdAt).toLocaleString("en-GB") : ""}
                  </td>
                  <td className="px-3 py-2">{vote.voterName}</td>
                  <td className="px-3 py-2">{vote.email}</td>
                  <td className="px-3 py-2">{vote.status}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600">
                    <div>ip {vote.ipHash?.slice(0, 12) ?? "—"}</div>
                    <div>cookie {vote.cookieId?.slice(0, 8) ?? "—"}</div>
                    <div>fp {vote.fingerprintHash?.slice(0, 12) ?? "—"}</div>
                    <div className="max-w-xs truncate">{vote.userAgent}</div>
                  </td>
                  <td className="px-3 py-2">
                    {vote.status !== "void" ? (
                      <button
                        type="button"
                        onClick={() => void voidRow(vote.id)}
                        className="text-sm underline"
                      >
                        Void
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
