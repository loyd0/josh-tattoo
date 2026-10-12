"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { countdownParts } from "@/lib/voting/countdown";

export function VoteCountdown({
  endsAt,
  initialNow,
  endsLabel,
  preview,
}: {
  endsAt: string;
  initialNow: number;
  endsLabel: string;
  preview: boolean;
}) {
  const router = useRouter();
  const [now, setNow] = useState(initialNow);
  const { days, hours, minutes, seconds, ended } = countdownParts(
    Date.parse(endsAt),
    now,
  );

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (ended && !preview) router.refresh();
  }, [ended, preview, router]);

  return (
    <section
      aria-label="Voting deadline"
      className="mt-7 border-y-2 border-[#1a1a1a]/15 py-5 sm:mt-8 sm:py-6"
    >
      <p className="text-xl font-bold sm:text-2xl">
        {ended ? "Voting has closed." : "Voting closes in"}
      </p>
      {!ended ? (
        <div
          role="timer"
          aria-live="off"
          aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`}
          className="mt-3 grid max-w-3xl grid-cols-4 gap-2 sm:gap-6"
        >
          {[
            [days, "Days"],
            [hours, "Hours"],
            [minutes, "Minutes"],
            [seconds, "Seconds"],
          ].map(([value, label]) => (
            <div key={label} aria-hidden="true" className="min-w-0 text-center">
              <span
                className="highlight-yellow inline-block min-w-[2ch] text-[clamp(2.5rem,10vw,6.5rem)] leading-none font-black tabular-nums"
                style={{ fontFamily: "Londrina Solid, cursive" }}
              >
                {String(value).padStart(2, "0")}
              </span>
              <span className="mt-2 block text-base text-[#3b4cca] sm:text-xl">
                {label}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-base text-[#333] sm:text-lg">
        {ended ? "Closed" : "Closes"} <time dateTime={endsAt}>{endsLabel}</time>{" "}
        UK time.
      </p>
    </section>
  );
}
