import CountUp from "./CountUp";
import ScrollReveal from "./ScrollReveal";

const STATS: Array<{
  to: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sub: string;
}> = [
  {
    to: 4,
    label: "Live demo builds",
    sub: "Real, deployed sites you can click into",
  },
  {
    to: 12,
    suffix: "+",
    label: "Niches templated",
    sub: "From mobile mechanics to music teachers",
  },
  {
    to: 24,
    suffix: "h",
    label: "From signup to live URL",
    sub: "We start the moment your form lands",
  },
  {
    to: 0,
    prefix: "$",
    label: "Deposit required",
    sub: "Pay only after you approve the site",
  },
];

export default function StatsStrip() {
  return (
    <section className="border-y border-[#1F1814]/10 bg-[#FAF6F0]">
      <div className="mx-auto w-full max-w-6xl px-6 py-7 sm:py-10">
        <ScrollReveal
          className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4"
          variant="stagger"
          staggerSelector=".stat"
        >
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <CountUp
                to={s.to}
                prefix={s.prefix}
                suffix={s.suffix}
                className="block text-5xl font-semibold leading-none tracking-tight text-[#1F1814] sm:text-6xl"
              />
              <div className="mt-3 text-sm font-semibold text-[#1F1814]">
                {s.label}
              </div>
              <div className="mt-1 text-xs text-[#1F1814]/55">{s.sub}</div>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
