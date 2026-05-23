import ScrollReveal from "./ScrollReveal";

const PROMISES = [
  {
    n: "01",
    title: "Built for your niche, not a template.",
    body: "Mobile mechanic, dog groomer, tutor — every site is rebuilt from the niche up. Different fonts, different photos, different copy. No two of our sites look the same.",
  },
  {
    n: "02",
    title: "Live URL within 24 hours, or it's free.",
    body: "We ship the moment your form lands. If it takes longer than a day, you pay nothing — the site is yours. The clock starts when you hit submit.",
  },
  {
    n: "03",
    title: "No deposit. Walk away keeping the draft.",
    body: "We build before we ever charge. If you don't approve the site, you owe nothing — and the draft is yours to keep, edit, or hand to someone else.",
  },
];

export default function Promises() {
  return (
    <section className="border-t border-[#1F1814]/10 bg-[#1F1814] text-[#FAF6F0]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#E89A6B]">
            Three promises
          </p>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What you actually get when we build for you.
          </h2>
          <p className="mt-6 text-lg text-[#FAF6F0]/70">
            Concrete, verifiable promises. If we miss any of them, the
            consequence is on us — not you.
          </p>
        </ScrollReveal>

        <ScrollReveal
          className="grid gap-px overflow-hidden rounded-3xl border border-[#FAF6F0]/10 bg-[#FAF6F0]/10 sm:grid-cols-3"
          variant="stagger"
          staggerSelector=".promise"
        >
          {PROMISES.map((p) => (
            <div key={p.n} className="promise bg-[#1F1814] p-7 sm:p-10">
              <div className="mb-6 font-mono text-sm font-semibold text-[#E89A6B]">
                {p.n}
              </div>
              <h3 className="text-xl font-semibold leading-snug text-[#FAF6F0] sm:text-2xl">
                {p.title}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[#FAF6F0]/65">
                {p.body}
              </p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
