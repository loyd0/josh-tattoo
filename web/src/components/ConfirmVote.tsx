"use client";

import { useState } from "react";
import { Turnstile } from "next-turnstile";

export function ConfirmVoteButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "working" | "counted" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function confirm() {
    setState("working");
    setMessage(null);
    const res = await fetch("/api/votes/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setState("error");
      setMessage(json?.error ?? "Could not count the vote.");
      return;
    }
    setState("counted");
  }

  if (state === "counted") {
    return (
      <p className="mt-6 rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-4 py-3 text-xl">
        Your vote is counted. Totals stay hidden until voting ends.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void confirm()}
        disabled={state === "working"}
        className="rounded-xl border-2 border-[#1a1a1a] bg-[#fff176] px-5 py-3 text-xl font-semibold disabled:opacity-50"
      >
        {state === "working" ? "Counting…" : "Count my vote"}
      </button>
      {message ? <p className="mt-3 text-lg text-red-700">{message}</p> : null}
    </div>
  );
}

export function ResendVoteForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"required" | "success">("required");
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setMessage(null);
    const res = await fetch("/api/votes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        honeypot,
        turnstileToken: siteKey ? token : "dev-bypass",
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    setWorking(false);
    if (!res.ok) {
      setMessage(json?.error ?? "Could not send the link.");
      return;
    }
    setMessage(json?.message ?? "If that address still has a vote waiting, we sent another link.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-3">
      <label className="block text-lg">
        Email on the vote
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-[#1a1a1a] px-3 py-2"
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
      {siteKey ? (
        <Turnstile
          siteKey={siteKey}
          onVerify={(value) => {
            setToken(value);
            setStatus("success");
          }}
        />
      ) : null}
      <button
        type="submit"
        disabled={working || (Boolean(siteKey) && status !== "success")}
        className="rounded-xl border-2 border-[#1a1a1a] bg-white px-4 py-2 text-lg font-semibold disabled:opacity-50"
      >
        {working ? "Sending…" : "Send the link again"}
      </button>
      {message ? <p className="text-lg">{message}</p> : null}
    </form>
  );
}
