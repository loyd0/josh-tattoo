export function SiteMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10 md:h-12 md:w-12">
        <svg viewBox="0 0 48 48" className="h-full w-full">
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
      <div
        className="text-lg font-black uppercase tracking-tight md:text-2xl"
        style={{ fontFamily: "Londrina Solid, cursive" }}
      >
        <span className="text-[#1a1a1a]">INK MY</span>
        <br />
        <span className="text-[#1a1a1a]">CANVAS</span>
      </div>
    </div>
  );
}
