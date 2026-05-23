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
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max gap-12 py-3 text-xs font-medium tracking-wide">
          {doubled.map((item, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-3 whitespace-nowrap"
            >
              <span className="font-mono uppercase tracking-[0.25em] text-[#E89A6B]">
                {i % 2 === 0 ? "Built" : "Live"}
              </span>
              <span className="text-[#FAF6F0]/85">{item}</span>
              <span className="text-[#FAF6F0]/30">·</span>
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
          animation: marquee-scroll 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
