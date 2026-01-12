"use client";

import { useState } from "react";

export function JoshPhoto() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

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
          {/* Photo container with doodles */}
          <div className="relative">
            {/* Devil horns doodle */}
            <svg
              className="absolute -left-1 -top-4 z-20 h-10 w-12 md:-left-2 md:-top-6 md:h-14 md:w-16"
              viewBox="0 0 64 56"
            >
              <path
                d="M12 48 Q8 30 4 12 M4 12 Q10 24 18 32"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M52 48 Q56 30 60 12 M60 12 Q54 24 46 32"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Halo */}
            <svg
              className="absolute -top-7 left-1/2 z-20 h-6 w-10 -translate-x-1/2 md:-top-10 md:h-8 md:w-14"
              viewBox="0 0 56 32"
            >
              <ellipse
                cx="28"
                cy="16"
                rx="24"
                ry="10"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2.5"
              />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/josh.png"
              alt="Josh pointing at the form"
              className="relative z-10 h-auto w-full"
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
