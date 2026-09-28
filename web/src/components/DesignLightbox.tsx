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
  frameClassName,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw",
  appearance = "frame",
  label = "View",
  badge = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isImage = contentType.startsWith("image/");

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setZoomed(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      style.overflow = previous.overflow;
      window.removeEventListener("keydown", onKey);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  function stopBubble(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  function openViewer(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setZoomed(false);
    setOpen(true);
  }

  function closeViewer(event?: React.SyntheticEvent) {
    event?.stopPropagation();
    setZoomed(false);
    setOpen(false);
  }

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[80] flex flex-col bg-[#1a1a1a]/92 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
            onClick={() => closeViewer()}
          >
            <h2 id={titleId} className="sr-only">
              {alt}
            </h2>
            <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
              {isImage ? (
                <button
                  type="button"
                  className="min-h-11 rounded-full border-2 border-[#1a1a1a] bg-white px-4 text-base font-semibold text-[#1a1a1a]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoomed((current) => !current);
                  }}
                >
                  {zoomed ? "Fit" : "Zoom"}
                </button>
              ) : (
                <span />
              )}
              <button
                ref={closeRef}
                type="button"
                className="min-h-11 rounded-full border-2 border-[#1a1a1a] bg-[#fff176] px-4 text-base font-semibold text-[#1a1a1a]"
                onClick={closeViewer}
              >
                Close
              </button>
            </div>
            <div
              className="relative mx-2 mb-2 min-h-0 flex-1 overflow-auto rounded-xl bg-[#f5f0e6] sm:mx-auto sm:mb-4 sm:w-full sm:max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={zoomed ? "relative h-[200%] w-[200%]" : "relative h-full w-full"}>
                {isImage ? (
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    priority
                    quality={90}
                    className="object-contain"
                    sizes="100vw"
                  />
                ) : (
                  <iframe title={alt} src={src} className="absolute inset-0 h-full w-full bg-white" />
                )}
              </div>
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
          onPointerDown={stopBubble}
          onClick={openViewer}
          className="min-h-11 text-zinc-900 underline underline-offset-4"
        >
          {label}
        </button>
        {dialog}
      </>
    );
  }

  const fitted = !frameClassName;

  return (
    <>
      <button
        type="button"
        onPointerDown={stopBubble}
        onClick={openViewer}
        aria-label={`View larger: ${alt}`}
        className={`relative block cursor-zoom-in overflow-hidden rounded-xl bg-[#f5f0e6] ${
          fitted ? "flex w-full items-center justify-center" : frameClassName
        }`}
      >
        {isImage && fitted ? (
          <Image
            src={src}
            alt=""
            width={1200}
            height={ratio ? Math.max(1, Math.round(1200 / ratio)) : 1500}
            sizes={sizes}
            onLoad={(event) => {
              const image = event.currentTarget;
              if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                setRatio(image.naturalWidth / image.naturalHeight);
              }
            }}
            className="h-auto max-h-[50svh] w-auto max-w-full object-contain sm:max-h-[32rem]"
          />
        ) : isImage ? (
          <span className="absolute inset-1.5 sm:inset-[6%]">
            <Image src={src} alt="" fill className="object-contain" sizes={sizes} />
          </span>
        ) : (
          <span className="flex h-full min-h-24 items-center justify-center px-3 text-center text-base underline">
            View this design
          </span>
        )}
        {badge ? (
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-[#1a1a1a]/80 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Expand
          </span>
        ) : null}
      </button>
      {dialog}
    </>
  );
}
