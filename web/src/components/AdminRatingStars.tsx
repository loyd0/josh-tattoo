"use client";

import { useMemo, useState } from "react";

type Props = {
  submissionId: string;
  initialRating: number | null;
};

type RatingValue = 1 | 2 | 3 | 4 | 5 | null;

function clampRating(v: number | null): RatingValue {
  if (v === null) return null;
  if (v === 1 || v === 2 || v === 3 || v === 4 || v === 5) return v;
  return null;
}

export function AdminRatingStars({ submissionId, initialRating }: Props) {
  const [rating, setRating] = useState<RatingValue>(clampRating(initialRating));
  const [hover, setHover] = useState<RatingValue>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => hover ?? rating ?? 0, [hover, rating]);

  async function persist(next: RatingValue) {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: next }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; rating: number | null }
        | { error: string }
        | null;

      if (!res.ok || !data || !("ok" in data) || !data.ok) {
        const msg = data && "error" in data ? data.error : "Failed to save rating";
        setError(msg);
        return;
      }

      const nextRating = clampRating(data.rating ?? null);
      setRating(nextRating);
    } catch {
      setError("Failed to save rating");
    } finally {
      setIsSaving(false);
    }
  }

  function onClickStar(v: 1 | 2 | 3 | 4 | 5) {
    // Clicking the currently selected rating clears it.
    const next: RatingValue = rating === v ? null : v;
    // Optimistic UI
    setRating(next);
    void persist(next);
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center ${isSaving ? "opacity-60" : ""}`}
        onMouseLeave={() => setHover(null)}
      >
        {(Array.from({ length: 5 }) as unknown as [0, 0, 0, 0, 0]).map((_, i) => {
          const v = (i + 1) as 1 | 2 | 3 | 4 | 5;
          const filled = v <= display;
          return (
            <button
              key={v}
              type="button"
              className={`p-0.5 ${isSaving ? "cursor-not-allowed" : "cursor-pointer"}`}
              aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(v)}
              onClick={() => onClickStar(v)}
              disabled={isSaving}
            >
              <svg
                className={`h-5 w-5 ${filled ? "text-amber-500" : "text-zinc-300"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.447a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.783.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.065 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69l1.286-3.957z" />
              </svg>
            </button>
          );
        })}
      </div>
      {error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : rating ? (
        <div className="text-xs text-zinc-600">{rating}/5</div>
      ) : (
        <div className="text-xs text-zinc-500">Unrated</div>
      )}
    </div>
  );
}

