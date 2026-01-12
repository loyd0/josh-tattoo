"use client";

import { useMemo, useState } from "react";

type Props = {
  submissionId: string;
  initialNotes: string | null;
};

export function AdminNotesModal({ submissionId, initialNotes }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<string>(initialNotes ?? "");
  const [draft, setDraft] = useState<string>(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesLabel = useMemo(() => {
    return notes.trim().length > 0 ? notes : "(none)";
  }, [notes]);

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; notes: string | null }
        | { error: string }
        | null;
      if (!res.ok || !data || ("error" in data && data.error)) {
        const msg =
          data && "error" in data && data.error
            ? data.error
            : "Failed to save notes";
        setError(msg);
        return;
      }
      if (!("ok" in data) || !data.ok) {
        setError("Failed to save notes");
        return;
      }
      const nextNotes = data.notes;
      setNotes(nextNotes ?? "");
      setIsOpen(false);
    } catch {
      setError("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  }

  function open() {
    setDraft(notes);
    setError(null);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setError(null);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Notes
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
            {notesLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={open}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Edit
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close notes modal"
            onClick={close}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-lg dark:border-white/15 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Edit notes
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Add a short note for this submission.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                placeholder="(optional)"
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
              {error ? (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

