"use client";

import { upload } from "@vercel/blob/client";
import { useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { TurnstileWidget } from "@/components/TurnstileWidget";
import { AllowedContentTypes, MAX_UPLOAD_BYTES } from "@/lib/validation";

type UploadState = "idle" | "uploading" | "submitting" | "done";

const BODY_AREAS = [
  "Prime Forearm Real Estate",
  "Upper Arm / Bicep",
  "Shoulder Blade",
  "Chest Piece Territory",
  "Ribcage (Pain Zone)",
  "Back Canvas",
  "Leg / Thigh",
  "Calf Muscle",
  "Ankle Area",
  "Wrist / Hand",
  "Neck (Bold Choice)",
  "Somewhere Surprising",
];

export function SubmitForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startedAtMs = useMemo(() => Date.now(), []);

  const [name, setName] = useState("");
  const [bodyArea, setBodyArea] = useState(BODY_AREAS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const disabled = state !== "idle";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That file is too large (max 25MB).");
      return;
    }

    if (!AllowedContentTypes.includes(file.type as never)) {
      setError("Unsupported file type. Use png/jpg/webp/pdf.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the Turnstile check.");
      return;
    }

    try {
      setState("uploading");

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/token",
        clientPayload: JSON.stringify({ turnstileToken }),
      });

      setState("submitting");

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bodyArea,
          notes: "", // Notes removed from this design
          blob: {
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType,
            size: file.size,
          },
          honeypot,
          startedAtMs,
          turnstileToken,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { ok: true; id: string }
        | { error: string };

      if (!res.ok) {
        setError(json && "error" in json ? json.error : "Submission failed.");
        setState("idle");
        return;
      }

      setState("done");
      router.push("/success");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      setState("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Name field */}
      <div>
        <label
          className="block text-base font-semibold text-[#333]"
          style={{ fontFamily: "Patrick Hand, cursive" }}
        >
          Who&apos;s to blame for this idea?
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={disabled}
          placeholder="e.g., Picasso (aka Dave)"
          className="mt-2 w-full rounded-lg border-2 border-[#1a1a1a] bg-white px-4 py-3 text-base outline-none transition-all focus:border-[#3b4cca] focus:ring-2 focus:ring-[#3b4cca]/20"
          style={{ fontFamily: "Patrick Hand, cursive" }}
        />
      </div>

      {/* Body area dropdown */}
      <div>
        <label
          className="block text-base font-semibold text-[#333]"
          style={{ fontFamily: "Patrick Hand, cursive" }}
        >
          Where should I stick it?
        </label>
        <div className="relative mt-2">
          <select
            value={bodyArea}
            onChange={(e) => setBodyArea(e.target.value)}
            required
            disabled={disabled}
            className="w-full appearance-none rounded-lg border-2 border-[#1a1a1a] bg-white px-4 py-3 pr-10 text-base outline-none transition-all focus:border-[#3b4cca] focus:ring-2 focus:ring-[#3b4cca]/20"
            style={{ fontFamily: "Patrick Hand, cursive" }}
          >
            {BODY_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-5 w-5 text-[#1a1a1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* File upload zone */}
      <div>
        <div
          className={`upload-zone relative cursor-pointer p-6 text-center ${isDragOver ? "dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            required
            disabled={disabled}
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="sr-only"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p
                className="text-base font-medium text-[#333]"
                style={{ fontFamily: "Patrick Hand, cursive" }}
              >
                {file.name}
              </p>
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: "Patrick Hand, cursive" }}
              >
                Click or drop to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="h-10 w-10 text-[#666]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p
                className="text-base font-medium text-[#333]"
                style={{ fontFamily: "Patrick Hand, cursive" }}
              >
                Drag & Drop Your Sketch/Pic!
              </p>
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: "Patrick Hand, cursive" }}
              >
                or{" "}
                <span className="text-[#3b4cca] underline">browse files</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Honeypot (spam trap) */}
      <label className="hidden">
        <span>Leave this blank</span>
        <input
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      <TurnstileWidget siteKey={siteKey} onToken={setTurnstileToken} />

      {error ? (
        <div
          className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-base text-red-900"
          style={{ fontFamily: "Patrick Hand, cursive" }}
        >
          {error}
        </div>
      ) : null}

      {/* Submit button */}
      <button
        type="submit"
        disabled={disabled}
        className="ink-button w-full rounded-full px-8 py-4 text-xl font-black uppercase tracking-wide text-white"
        style={{ fontFamily: "Londrina Solid, cursive" }}
      >
        {state === "uploading" ? (
          "Uploading…"
        ) : state === "submitting" ? (
          "Submitting…"
        ) : (
          <>
            INK IT!
            <span className="block text-sm font-normal normal-case tracking-normal opacity-90">
              (Submit Idea)
            </span>
          </>
        )}
      </button>
    </form>
  );
}
