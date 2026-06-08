"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function HeroText() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(el.querySelectorAll(".hero-chip"), {
        opacity: 0,
        y: 8,
        duration: 0.5,
      })
        .from(
          el.querySelectorAll(".hero-word"),
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.04,
          },
          "-=0.15",
        )
        .from(
          el.querySelector(".hero-sub"),
          { opacity: 0, y: 12, duration: 0.5 },
          "-=0.25",
        )
        .from(
          el.querySelectorAll(".hero-cta"),
          { opacity: 0, y: 10, duration: 0.4, stagger: 0.06 },
          "-=0.3",
        );
    },
    { scope: root },
  );

  return (
    <div ref={root} style={{ perspective: "800px" }}>
      <span className="hero-chip mb-6 inline-flex items-center gap-2 rounded-full bg-[#C2410C] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        For mobile mechanics, dog groomers &amp; tutors
      </span>

      <h1
        className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
      >
        <span className="hero-word inline-block">Get</span>{" "}
        <span className="hero-word inline-block text-[#C2410C]">found</span>
        <span className="hero-word inline-block">.</span>{" "}
        <span className="hero-word inline-block">Get</span>{" "}
        <span className="hero-word inline-block text-[#C2410C]">booked</span>
        <span className="hero-word inline-block">.</span>
      </h1>

      <p className="hero-sub mt-6 max-w-xl text-lg leading-relaxed text-[#1F1814]/70 sm:text-xl">
        Mobile-service businesses lose an average of{" "}
        <span className="font-semibold text-[#1F1814]">3–5 jobs a week</span>{" "}
        to competitors who show up on Google. We research your business and
        design the site for you — live in 24 hours — and you pay{" "}
        <span className="font-semibold text-[#1F1814]">$0 until you approve it</span>.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href="#contact"
          className="hero-cta inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412]"
        >
          Build mine free →
        </a>
        <a
          href="#how"
          className="hero-cta inline-flex items-center justify-center rounded-xl border border-[#1F1814]/15 bg-white px-6 py-4 text-base font-semibold text-[#1F1814] transition hover:border-[#1F1814]/40"
        >
          How it works
        </a>
      </div>
    </div>
  );
}
