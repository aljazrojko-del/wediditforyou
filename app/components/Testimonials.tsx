"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollReveal from "./ScrollReveal";

// To swap with a real customer quote: replace any entry in this array.
// Keep the same shape — the carousel picks it up automatically.
type Testimonial = {
  quote: string;
  metric: string;
  name: string;
  city: string;
  niche: string;
  tenure?: string;
  placeholder?: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Paid a guy in 2024 $1,400 for a website that never worked right. Forms didn't send. Couldn't update my phone number. Sat there for a year doing nothing. Alex's people built mine in a day and didn't take a dime until I said yes. Got 4 calls the first week from people who Googled 'mobile mechanic Houston.' That's about 3 real jobs.",
    metric: "4 calls in week 1",
    name: "Carlos M.",
    city: "Houston, TX",
    niche: "Mobile mechanic",
    tenure: "32 years",
    placeholder: true,
  },
  {
    quote:
      "Thought it was a scam at first. Nobody builds a website in 24 hours without taking money. Then he texted me the link the next morning and there it was — looked better than the dealer site I worked at before going independent. I asked what the catch was. He said 'pay me $450 if you keep it, nothing if you don't.' That was the catch.",
    metric: "Live in 22 hours",
    name: "Tony R.",
    city: "Phoenix, AZ",
    niche: "Mobile mechanic",
    placeholder: true,
  },
  {
    quote:
      "What sold me was the walk-away part. Been in this trade 19 years, I know when somebody's trying to lock me in. Alex didn't ask for a card, didn't ask for a signature, didn't ask for nothing. Sent me a draft. I picked it apart on the call. He fixed everything in one sitting. Took the money the next day after I confirmed.",
    metric: "Zero deposit, zero pressure",
    name: "Mike B.",
    city: "San Antonio, TX",
    niche: "Mobile mechanic",
    tenure: "19 years",
    placeholder: true,
  },
  {
    quote:
      "I show up second now when someone searches 'mobile mechanic Tampa.' Used to be on page 4. 2 of the calls from last month were bigger jobs than I usually get — alternator replacement, full brake job on an F-250. About $1,800 in work I wouldn't have seen otherwise. The site paid for itself the second week.",
    metric: "Page 4 → Page 1 in ~30 days",
    name: "Wayne H.",
    city: "Tampa, FL",
    niche: "Mobile mechanic",
    placeholder: true,
  },
  {
    quote:
      "Was running everything through Instagram DMs and missing half of them. The site has a booking calendar wired to my phone — somebody picks a time slot and I get a text. Haven't missed an appointment since. Books out 2 weeks ahead now.",
    metric: "0 missed bookings since launch",
    name: "Yvette B.",
    city: "Austin, TX",
    niche: "Mobile dog groomer",
    placeholder: true,
  },
  {
    quote:
      "There's 3 other mobile groomers in my zip code. 2 of them have ugly Wix sites from 2018, one has no site at all. Mine looks like a real boutique now. I raised my rates $8 per dog the week the site went live. Nobody flinched. The site made me look like the premium option.",
    metric: "Raised prices $8/dog after launch",
    name: "Marcus L.",
    city: "Dallas, TX",
    niche: "Mobile dog groomer",
    placeholder: true,
  },
  {
    quote:
      "Parents Google me before they message. Without a site I was losing them at the first step — they didn't know if I was a real person or a scam. The site has my photo, my certifications, parent quotes. 3 new students in the first month, all from the site. Used to take me 3 months to fill that many slots.",
    metric: "3 students in month 1 (vs. 3 months usual)",
    name: "Sarah P.",
    city: "Houston, TX",
    niche: "SAT tutor",
    placeholder: true,
  },
  {
    quote:
      "I'd been meaning to make a website for 2 years. Got quotes from $2,500 to $5,000. Couldn't justify it on tutoring hours. Alex did mine for $450 and it's better than the $5k ones I looked at. Already getting referral inquiries through the contact form — from parents who got my name from another parent.",
    metric: "$450 vs. $2,500–$5,000 agency quotes",
    name: "David C.",
    city: "Phoenix, AZ",
    niche: "Math tutor",
    tenure: "7 years",
    placeholder: true,
  },
];

const AUTO_ADVANCE_MS = 8000;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const anyPlaceholder = TESTIMONIALS.some((t) => t.placeholder);

  // Auto-advance every AUTO_ADVANCE_MS, unless paused or user prefers reduced motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (paused) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  // Animate the card whenever index changes
  useGSAP(
    () => {
      const el = cardRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { opacity: 1, x: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, x: direction * 80 },
        { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" },
      );
    },
    { dependencies: [index, direction] },
  );

  function go(next: number) {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function prev() {
    setDirection(-1);
    setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }
  function next() {
    setDirection(1);
    setIndex((i) => (i + 1) % TESTIMONIALS.length);
  }

  const t = TESTIMONIALS[index];

  return (
    <section className="border-t border-[#1F1814]/10 bg-[#FAF6F0]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
            What owners say
          </p>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {anyPlaceholder
              ? "The kind of outcomes our owners get."
              : "What our owners actually say."}
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#1F1814]/65">
            Specific. Local. No marketing-speak. Pick a niche you recognize —
            that&apos;s the one that&apos;ll match yours.
          </p>
        </ScrollReveal>

        {/* Carousel */}
        <div
          className="relative mx-auto max-w-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* Card stage — fixed perspective so slide doesn't reflow neighbours */}
          <div
            className="relative overflow-hidden rounded-3xl"
            aria-live="polite"
            aria-atomic="true"
          >
            <article
              ref={cardRef}
              key={index}
              className="flex flex-col rounded-3xl border border-[#1F1814]/10 bg-white p-7 sm:p-9"
            >
              {/* Niche + tenure tag */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#C2410C]/30 bg-[#C2410C]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">
                  {t.niche}
                </span>
                {t.tenure && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1F1814]/45">
                    {t.tenure} in trade
                  </span>
                )}
              </div>

              {/* Quote */}
              <p className="mt-5 text-base leading-relaxed text-[#1F1814]/85 sm:text-lg">
                {t.quote}
              </p>

              {/* Metric pull */}
              <div className="mt-6 rounded-xl bg-[#1F1814]/5 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1F1814]/55">
                  Result
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1F1814]">
                  {t.metric}
                </p>
              </div>

              {/* Attribution */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#1F1814]/10 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#C2410C] to-[#9A3412] font-mono text-xs font-bold text-white">
                    {initials(t.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1814]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[#1F1814]/55">{t.city}</p>
                  </div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1F1814]/40">
                  {index + 1} / {TESTIMONIALS.length}
                </p>
              </div>
            </article>
          </div>

          {/* Side arrows — hidden on small screens to save room */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 hidden -translate-x-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#1F1814]/10 bg-white text-[#1F1814]/60 transition hover:border-[#C2410C]/40 hover:text-[#C2410C] sm:flex sm:h-11 sm:w-11"
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-14 items-center justify-center rounded-full border border-[#1F1814]/10 bg-white text-[#1F1814]/60 transition hover:border-[#C2410C]/40 hover:text-[#C2410C] sm:flex sm:h-11 sm:w-11"
          >
            <span aria-hidden>›</span>
          </button>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((entry, i) => {
              const isActive = i === index;
              return (
                <button
                  key={`${entry.name}-${entry.city}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show testimonial ${i + 1} of ${TESTIMONIALS.length}`}
                  aria-current={isActive}
                  className={`h-2 rounded-full transition-all ${
                    isActive
                      ? "w-8 bg-[#C2410C]"
                      : "w-2 bg-[#1F1814]/20 hover:bg-[#1F1814]/40"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {anyPlaceholder && (
          <p className="mt-8 max-w-3xl text-sm text-[#1F1814]/55">
            <span className="font-semibold text-[#1F1814]/75">Note:</span>{" "}
            These are illustrative examples of the outcomes we&apos;re building
            toward with our founding 10 customers. As real owners come on
            board, their actual quotes and photos will replace these one by
            one.
          </p>
        )}
      </div>
    </section>
  );
}
