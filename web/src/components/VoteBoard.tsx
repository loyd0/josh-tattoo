"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [choice, setChoice] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const detailsRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const choiceIndex = entries.findIndex((entry) => entry.id === choice);
  const choiceLabel = choiceIndex >= 0 ? `Design ${choiceIndex + 1}` : null;

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/device", { credentials: "same-origin" });
        if (!res.ok) throw new Error("Device cookie failed");
        const json = (await res.json()) as { created?: boolean };
        if (!cancelled) {
          setDeviceReady(true);
          if (json.created) router.refresh();
        }
      } catch {
        if (!cancelled)
          setError(
            "We couldn’t prepare your browser to vote. Enable cookies and reload the page.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, preview]);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details || preview || done) return;
    const observer = new IntersectionObserver(
      ([entry]) => setDetailsVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -100px 0px", threshold: 0.1 },
    );
    observer.observe(details);
    return () => observer.disconnect();
  }, [preview, done]);

  function resetSecurityCheck() {
    setTurnstileStatus("required");
    setTurnstileToken("");
    setTurnstileVersion((current) => current + 1);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (preview || submitting) return;
    setError(null);
    if (!choice) {
      setError("Choose your favourite design above first.");
      return;
    }
    if (!deviceReady) {
      setError("Enable cookies and reload the page before voting.");
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
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(
          json?.error ?? "We couldn’t send your vote. Please try again.",
        );
        resetSecurityCheck();
        return;
      }
      setDone(json?.message ?? "Check your email and confirm your vote.");
    } catch {
      setError(
        "We couldn’t reach the server. Check your connection and try again.",
      );
      resetSecurityCheck();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-5 pb-28 sm:px-6 sm:py-8 sm:pb-12 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a]/15 pb-5 sm:pb-6">
        <SiteMark />
        <span className="text-base text-[#3b4cca] sm:text-lg">
          {preview ? "Ballot preview" : "The final three"}
        </span>
      </header>
      <div className="py-7 sm:py-10">
        <h1
          className="text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-[1.05]"
          style={{ fontFamily: "Londrina Solid, cursive" }}
        >
          <span className="highlight-yellow">You pick. I get inked.</span>
        </h1>
        <p className="mt-4 max-w-xl text-xl leading-relaxed text-[#333] sm:text-2xl">
          Three designs. One very permanent decision. Choose your favourite,
          then confirm your vote by email.
        </p>
        {endsLabel ? (
          <p className="mt-3 text-base text-[#333] sm:text-lg">
            Voting closes <strong>{endsLabel} UK time.</strong>
          </p>
        ) : null}
        <p className="mt-2 text-base text-[#333]">
          One vote each. Results stay hidden until voting ends.
        </p>
      </div>
      {banner ? (
        <p className="mb-6 rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-4 py-3 text-lg">
          {banner}
        </p>
      ) : null}
      {preview ? (
        <p className="mb-6 text-base text-[#333]">
          You can enlarge the images here. Choosing a design and sending a vote
          are disabled in this preview.
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="text-xl">
          The shortlist is being prepared. Please check back soon.
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <fieldset
            id="designs"
            className="grid min-w-0 scroll-mt-6 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <legend className="mb-4 text-2xl font-bold">
              1. Pick your favourite
            </legend>
            {entries.map((entry, index) => {
              const selected = choice === entry.id;
              return (
                <article
                  key={entry.id}
                  className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 bg-[#fefefe] p-3 sm:p-4 ${selected ? "border-[#3b4cca] ring-2 ring-[#3b4cca]/20" : "border-[#1a1a1a]/20"}`}
                >
                  <h2 className="mb-3 text-xl font-bold">Design {index + 1}</h2>
                  <DesignLightbox
                    src={entry.fileUrl}
                    alt={`Design ${index + 1}: ${entry.explanation?.slice(0, 100) || "Tattoo design"}`}
                    contentType={entry.contentType}
                    frameClassName="aspect-[4/3] w-full"
                  />
                  <p className="my-4 flex-1 whitespace-pre-wrap break-words text-lg leading-snug text-[#333]">
                    {entry.explanation?.trim() ||
                      "Let the drawing do the talking."}
                  </p>
                  <label
                    className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 py-3 text-lg font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-[#3b4cca] ${preview || submitting || done ? "cursor-default" : "cursor-pointer"} ${selected ? "border-[#3b4cca] bg-[#fff176]" : "border-[#1a1a1a]/20 bg-[#f5f0e6]"}`}
                  >
                    <input
                      type="radio"
                      name="design"
                      value={entry.id}
                      checked={selected}
                      onChange={() => setChoice(entry.id)}
                      className="h-5 w-5 shrink-0 accent-[#3b4cca]"
                      required
                      disabled={preview || submitting || Boolean(done)}
                      aria-label={`Choose Design ${index + 1}`}
                    />
                    {selected ? "Your choice" : "Choose this design"}
                  </label>
                </article>
              );
            })}
          </fieldset>

          {done ? (
            <div
              role="status"
              className="mt-8 max-w-2xl rounded-2xl border-2 border-[#1a1a1a] bg-[#fefefe] p-5 sm:p-6"
            >
              <h2 className="text-2xl font-bold">One last step: your inbox.</h2>
              <p className="mt-3 text-xl">{done}</p>
              <p className="mt-3 text-lg">
                Look for “Confirm your tattoo vote” and check your junk folder
                too. Your vote counts after you open the link and press “Count
                my vote”.
              </p>
              <Link
                href="/vote/verify"
                className="mt-4 inline-flex min-h-11 items-center text-lg text-[#3b4cca] underline underline-offset-4"
              >
                Need another confirmation email?
              </Link>
            </div>
          ) : (
            <section
              ref={detailsRef}
              id="vote-details"
              className="mt-8 max-w-xl scroll-mt-6 border-t-2 border-[#1a1a1a]/15 pt-6 sm:mt-10 sm:pt-8"
              aria-labelledby="vote-details-heading"
            >
              <h2 id="vote-details-heading" className="text-2xl font-bold">
                2. Make it count
              </h2>
              <p className="mt-2 text-lg" aria-live="polite">
                {choiceLabel ? (
                  <>
                    <strong>{choiceLabel}</strong> is your choice.{" "}
                    <a
                      href="#designs"
                      className="text-[#3b4cca] underline underline-offset-4"
                    >
                      Change it
                    </a>{" "}
                    before sending.
                  </>
                ) : (
                  "Choose a design above, then enter your details."
                )}
              </p>
              <div className="mt-5 space-y-4">
                <label className="block text-lg">
                  Your name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={200}
                    autoComplete="name"
                    disabled={preview || submitting}
                    className="mt-1 min-h-12 w-full rounded-xl border-2 border-[#1a1a1a]/30 bg-[#fefefe] px-3 py-2 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b4cca] disabled:opacity-60"
                  />
                </label>
                <label className="block text-lg">
                  Your email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={200}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={preview || submitting}
                    aria-describedby="email-help"
                    className="mt-1 min-h-12 w-full rounded-xl border-2 border-[#1a1a1a]/30 bg-[#fefefe] px-3 py-2 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b4cca] disabled:opacity-60"
                  />
                </label>
                <p id="email-help" className="text-base text-[#333]">
                  We’ll send a link to confirm your vote. Your name and email
                  stay private.
                </p>
                <label className="hidden" aria-hidden="true">
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
                    key={turnstileVersion}
                    siteKey={siteKey}
                    size="compact"
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
                {turnstileStatus === "error" ||
                turnstileStatus === "expired" ? (
                  <p className="text-base text-red-700">
                    The security check{" "}
                    {turnstileStatus === "expired"
                      ? "expired"
                      : "couldn’t load"}
                    .{" "}
                    <button
                      type="button"
                      onClick={resetSecurityCheck}
                      className="min-h-11 underline"
                    >
                      Try it again
                    </button>
                    .
                  </p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-lg text-red-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={preview || submitting || !choice || !deviceReady}
                  className="min-h-12 w-full rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-5 py-3 text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3b4cca] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {preview
                    ? "Preview only"
                    : submitting
                      ? "Sending your confirmation…"
                      : "Send my vote"}
                </button>
                <p className="text-base text-[#333]">
                  Your choice locks when you send it.
                </p>
              </div>
            </section>
          )}
        </form>
      )}
      {entries.length > 0 && !done && !preview && !detailsVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#1a1a1a] bg-[#f5f0e6] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
          <a
            href={choice ? "#vote-details" : "#designs"}
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-3 text-center text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b4cca]"
          >
            {choiceLabel
              ? `Continue with ${choiceLabel} →`
              : "Choose a design above ↑"}
          </a>
        </div>
      ) : null}
    </main>
  );
}
