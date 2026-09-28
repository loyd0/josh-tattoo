"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  alt: string;
  contentType: string;
  frameClassName?: string;
  sizes?: string;
  appearance?: "frame" | "text";
  label?: string;
  badge?: boolean;
};

export function DesignLightbox({
  src,
  alt,
  contentType,
  frameClassName = "aspect-[3/4] w-full",
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw",
  appearance = "frame",
  label = "View",
  badge = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isImage = contentType.startsWith("image/");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openViewer(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a1a1a]/85 p-3 sm:p-8"
            onClick={() => setOpen(false)}
          >
            <h2 id={titleId} className="sr-only">
              {alt}
            </h2>
            <button
              ref={closeRef}
              type="button"
              className="absolute right-3 top-3 z-[81] rounded-full border-2 border-[#1a1a1a] bg-[#fff176] px-4 py-2 text-base font-semibold text-[#1a1a1a] sm:right-6 sm:top-6"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
              }}
            >
              Close
            </button>
            <div
              className="relative h-[calc(100dvh-5.5rem)] w-full max-w-5xl overflow-hidden rounded-xl bg-[#f5f0e6]"
              onClick={(event) => event.stopPropagation()}
            >
              {isImage ? (
                <span className="absolute inset-[4%] sm:inset-[6%]">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    priority
                    quality={90}
                    className="object-contain"
                    sizes="100vw"
                  />
                </span>
              ) : (
                <iframe title={alt} src={src} className="h-full w-full bg-white" />
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  if (appearance === "text") {
    return (
      <>
        <button
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={openViewer}
          className="text-zinc-900 underline underline-offset-4"
        >
          {label}
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={openViewer}
        aria-label={`View larger: ${alt}`}
        className={`relative block cursor-zoom-in overflow-hidden rounded-xl bg-[#f5f0e6] ${frameClassName}`}
      >
        {isImage ? (
          <span className="absolute inset-[6%]">
            <Image src={src} alt="" fill className="object-contain" sizes={sizes} />
          </span>
        ) : (
          <span className="flex h-full min-h-24 items-center justify-center px-3 text-center text-base underline">
            View this design
          </span>
        )}
        {badge ? (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-[#1a1a1a]/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Expand
          </span>
        ) : null}
      </button>
      {dialog}
    </>
  );
}
