const ITEMS = [
  "Diaz Mobile Auto · Houston, TX",
  "Buddy's Mobile Spa · Lubbock, TX",
  "Bright Path Tutoring · Cedar Rapids, IA",
  "Elite Mobile Tire & Brake · Lubbock, TX",
  "Reyes Plumbing & Drain · Phoenix, AZ",
  "Bella's Hair Studio · Brooklyn, NY",
];

export default function Marquee() {
  // Render the list twice back-to-back so the loop is seamless.
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="border-y border-[#1F1814]/10 bg-[#1F1814] text-[#FAF6F0]">
      <div className="relative overflow-hidden">
        {/* Fade-out edges so items don't get awkwardly cut off mid-text */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#1F1814] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#1F1814] to-transparent" />

        <div className="marquee-track flex w-max gap-14 py-4 text-sm font-medium tracking-wide sm:py-5">
          {doubled.map((item, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-4 whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-[#E89A6B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E89A6B]" />
                {i % 2 === 0 ? "Built" : "Live"}
              </span>
              <span className="text-[#FAF6F0]/90">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 38s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation-duration: 80s;
          }
        }
      `}</style>
    </div>
  );
}
