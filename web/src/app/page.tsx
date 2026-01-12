import { SubmitForm } from "@/components/SubmitForm";
import { JoshPhoto } from "@/components/JoshPhoto";

export default function Home() {
  return (
    <main className="paper-bg relative min-h-dvh overflow-x-hidden">
      {/* Header - Centered on mobile, spaced on desktop */}
      <header className="flex items-center justify-center px-4 py-4 md:justify-between md:px-10 md:py-6">
        <div className="flex items-center gap-2">
          {/* Logo icon */}
          <div className="relative h-10 w-10 md:h-12 md:w-12">
            <svg viewBox="0 0 48 48" className="h-full w-full">
              {/* Crossed pencil and brush */}
              <g transform="rotate(-30, 24, 24)">
                <rect x="22" y="4" width="4" height="36" rx="1" fill="#1a1a1a" />
                <polygon points="24,4 20,12 28,12" fill="#ffd54f" />
                <rect x="20" y="36" width="8" height="4" rx="1" fill="#ff6b6b" />
              </g>
              <g transform="rotate(30, 24, 24)">
                <rect x="22" y="4" width="4" height="36" rx="1" fill="#4a5cd9" />
                <circle cx="24" cy="40" r="3" fill="#4a5cd9" />
                <ellipse cx="24" cy="8" rx="4" ry="6" fill="#ffd54f" />
              </g>
            </svg>
          </div>
          <div className="text-lg font-black uppercase tracking-tight md:text-2xl" style={{ fontFamily: 'Londrina Solid, cursive' }}>
            <span className="text-[#1a1a1a]">INK MY</span>
            <br />
            <span className="text-[#1a1a1a]">CANVAS</span>
          </div>
        </div>

      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-3 py-1 md:px-8 md:py-12">
        <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          
          {/* Hero content - Centered on mobile, left-aligned on desktop */}
          <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:pt-8 lg:text-left">
            <h1
              className="text-[2.5rem] font-black leading-[1.1] md:text-5xl lg:text-6xl"
              style={{ fontFamily: 'Londrina Solid, cursive' }}
            >
              <span className="highlight-yellow inline-block -rotate-1">Help Me Ruin</span>
              <br />
              <span className="highlight-yellow inline-block rotate-1">My Body</span>
              <br />
              <span className="inline-block">(Artistically)!</span>
            </h1>

            <p
              className="mt-3 max-w-sm px-2 text-[1.05rem] leading-relaxed text-[#333] md:mt-6 md:max-w-md md:px-0 md:text-xl lg:max-w-none lg:text-2xl"
              style={{ fontFamily: 'Patrick Hand, cursive' }}
            >
              Hello. Before I&apos;m 30, I need to get a tattoo — and I can&apos;t decide what it should be. So I&apos;m crowdsourcing some designs from you lot. I&apos;ll keep it anonymous to avoid any bias, pick my top three, and then (probably) put it to a public vote.
            </p>

            {/* Josh photo - overlaps the notebook on mobile */}
            <JoshPhoto />
          </div>

          {/* Form notebook */}
          <div className="relative -mt-4 w-full max-w-sm md:max-w-md lg:mt-0 lg:max-w-lg">
            {/* Grid paper decoration - top right */}
            <div className="grid-paper-corner" />
            
            {/* Polka tape - bottom right */}
            <div className="tape-polka-corner" />

            {/* Notebook with spiral binding on left */}
            <div className="notebook-mobile relative overflow-visible rounded-lg bg-white p-4 pb-5 pl-5 shadow-lg md:p-8">
              {/* Left spiral binding */}
              <div className="notebook-spiral" />
              
              <h2
                className="mb-3 text-xl font-black md:mb-6 md:text-3xl"
                style={{ fontFamily: 'Londrina Solid, cursive' }}
              >
                Drop Your Ink Genius Here.
              </h2>

              <SubmitForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tape decorations */}
      <div className="tape-bottom-left" />
      <div className="tape-bottom-right" />

      {/* Ideas section anchor */}
      <div id="ideas" className="h-16 md:h-32" />
    </main>
  );
}
