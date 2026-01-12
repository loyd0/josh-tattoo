"use client";

import { useEffect, useRef, useState } from "react";

export function JoshPhoto() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // If the image loads before hydration, React may miss the onLoad event.
  // Detect already-loaded images on mount so the photo doesn't stay hidden.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth > 0) {
        setImageLoaded(true);
      } else {
        setHasError(true);
      }
    }
  }, []);

  // Don't render anything if image failed to load
  if (hasError) {
    return null;
  }

  return (
    <div
      className="relative z-20 mt-4 w-40 self-center md:mt-6 md:w-48 lg:mt-8 lg:w-64 lg:self-start"
      style={{ display: imageLoaded ? "block" : "none" }}
    >
      <div className="photo-cutout relative">
        <div className="relative">
          <div className="relative">
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet="/josh-tattoo-desktop.png"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src="/josh-tattoo-mobile.png"
                alt="Josh pointing at the form"
                className="relative z-10 h-auto w-full"
                onLoad={() => setImageLoaded(true)}
                onError={() => setHasError(true)}
              />
            </picture>
          </div>
        </div>
      </div>
    </div>
  );
}
