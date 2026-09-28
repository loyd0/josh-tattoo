"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "next-turnstile";

import { DesignLightbox } from "@/components/DesignLightbox";
import { SiteMark } from "@/components/SiteMark";
import { browserFingerprint } from "@/lib/voting/fingerprint";

export type VoteCard = {
  id: string;
  fileUrl: string;
  contentType: string;
  explanation: string | null;
};

export function VoteBoard({
  entries,
  endsLabel,
  preview,
  banner,
}: {
  entries: VoteCard[];
  endsLabel: string | null;
  preview: boolean;
  banner?: string | null;
}) {
  const router = useRouter();
  const startedAtMsRef = useRef<number>(Date.now());
  const [choice, setChoice] = useState<string>(entries[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/device", { credentials: "same-origin" });
      const json = (await res.json().catch(() => null)) as { created?: boolean } | null;
      if (!cancelled && json?.created) router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (preview) return;
    setError(null);
    if (!choice) {
      setError("Pick a design first.");
      return;
    }
    const token = siteKey ? turnstileToken : "dev-bypass";
    if (siteKey && (turnstileStatus !== "success" || !token)) {
      setError("Please complete the security check.");
      return;
    }
    setSubmitting(true);
    try {
      const fingerprint = await browserFingerprint();
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: choice,
          name,
          email,
          fingerprint,
          honeypot,
          startedAtMs: startedAtMsRef.current,
          turnstileToken: token,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; message?: string }
        | { error: string }
        | null;
      if (!res.ok) {
        setError(json && "error" in json ? json.error : "Vote failed.");
        setTurnstileStatus("required");
        setTurnstileToken("");
        return;
      }
      setDone(json && "message" in json && json.message ? json.message : "Check your email.");
    } catch {
      setError("Vote failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 pb-28 sm:px-4 sm:py-8 sm:pb-8 md:px-8">
      <header className="mb-6">
        <SiteMark />
      </header>

      <h1
        className="text-3xl font-black leading-none sm:text-4xl md:text-6xl"
        style={{ fontFamily: "Londrina Solid, cursive" }}
      >
        <span className="highlight-yellow">Pick a favourite.</span>
      </h1>
      <p
        className="mt-3 max-w-2xl text-lg text-[#333] sm:mt-4 sm:text-xl"
        style={{ fontFamily: "Patrick Hand, cursive" }}
      >
        One vote. Your choice locks when you submit, and it only counts after you
        confirm the email. Totals stay hidden until the end.
        {endsLabel ? ` Voting closes ${endsLabel} UK time.` : ""}
      </p>
      {banner ? (
        <p className="mt-4 rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-4 py-3 text-lg">
          {banner}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-8 text-xl">Nothing is on the ballot yet.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8">
          <fieldset className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <legend className="sr-only">Designs</legend>
            {entries.map((entry) => {
              const selected = choice === entry.id;
              return (
                <label
                  key={entry.id}
                  className={`block cursor-pointer rounded-2xl border-2 bg-white p-3 shadow-sm ${
                    selected ? "border-[#1a1a1a] ring-4 ring-[#fff176]" : "border-black/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="design"
                    value={entry.id}
                    checked={selected}
                    onChange={() => setChoice(entry.id)}
                    className="sr-only"
                    required
                    disabled={preview || submitting || Boolean(done)}
                  />
                  <DesignLightbox
                    src={entry.fileUrl}
                    alt={entry.explanation?.slice(0, 80) || "Tattoo design"}
                    contentType={entry.contentType}
                  />
                  <p className="mt-3 whitespace-pre-wrap text-base leading-snug text-[#333] sm:text-lg">
                    {entry.explanation?.trim() || "No explanation."}
                  </p>
                </label>
              );
            })}
          </fieldset>

          {done ? (
            <p className="mt-8 rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-4 text-xl">
              {done}
            </p>
          ) : (
            <div
              id="vote-details"
              className="mt-6 max-w-md scroll-mt-6 space-y-4 rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 sm:mt-8 sm:p-5"
            >
              <label className="block text-lg">
                Your name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  disabled={preview || submitting}
                  className="mt-1 w-full rounded-lg border-2 border-[#1a1a1a] px-3 py-2 text-lg outline-none"
                />
              </label>
              <label className="block text-lg">
                Your email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  disabled={preview || submitting}
                  className="mt-1 w-full rounded-lg border-2 border-[#1a1a1a] px-3 py-2 text-lg outline-none"
                />
              </label>
              <label className="hidden">
                <span>Leave this blank</span>
                <input
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
              {siteKey && !preview ? (
                <Turnstile
                  siteKey={siteKey}
                  onVerify={(token) => {
                    setTurnstileToken(token);
                    setTurnstileStatus("success");
                  }}
                  onError={() => {
                    setTurnstileToken("");
                    setTurnstileStatus("error");
                  }}
                  onExpire={() => {
                    setTurnstileToken("");
                    setTurnstileStatus("expired");
                  }}
                />
              ) : null}
              {error ? <p className="text-lg text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={preview || submitting || entries.length === 0}
                className="min-h-12 w-full rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-5 py-3 text-xl font-semibold disabled:opacity-50 sm:w-auto"
              >
                {preview ? "Preview only" : submitting ? "Sending…" : "Lock in my vote"}
              </button>
            </div>
          )}
        </form>
      )}
      {entries.length > 0 && !done && !preview ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#1a1a1a] bg-[#fff176] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
          <a href="#vote-details" className="block min-h-11 text-center text-lg font-semibold leading-[2.75rem]">
            Lock in this design
          </a>
        </div>
      ) : null}
    </main>
  );
}
