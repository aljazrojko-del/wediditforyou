"use client";

import { useEffect, useRef, useState } from "react";

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${pct / 100})`;
      }
      setScrolled(y > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[#1F1814]/10 bg-[#FAF6F0]/85 backdrop-blur"
          : "bg-gradient-to-r from-[#F0E9DC] via-[#FAF6F0] to-[#E89A6B]/35"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl items-center justify-between px-6 transition-all duration-300 ${
          scrolled ? "py-3.5" : "py-5"
        }`}
      >
        {/* Logo with branded mark */}
        <a
          href="#top"
          className="group flex items-center gap-2.5 text-[#1F1814]"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C2410C] to-[#E89A6B] text-[13px] font-bold text-white shadow-sm transition group-hover:scale-105">
            W
          </span>
          <span className="font-mono text-sm tracking-tight">
            wediditforyou
            <span className="text-[#C2410C]">.</span>
          </span>
        </a>

        {/* Nav links with warmer hover */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#1F1814]/75 sm:flex">
          <a
            href="#how"
            className="relative transition hover:text-[#C2410C]"
          >
            How it works
          </a>
          <a
            href="#work"
            className="relative transition hover:text-[#C2410C]"
          >
            Sample builds
          </a>
          <a
            href="#pricing"
            className="relative transition hover:text-[#C2410C]"
          >
            Pricing
          </a>
        </nav>

        {/* CTA with peach glow */}
        <a
          href="#contact"
          className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#C2410C] to-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C2410C]/30 transition hover:shadow-lg hover:shadow-[#C2410C]/40"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">Get yours</span>
          <span className="relative text-[#FAF6F0]/80">→</span>
        </a>
      </div>

      {/* Scroll progress */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#1F1814]/5">
        <div
          ref={progressRef}
          className="h-full origin-left bg-gradient-to-r from-[#C2410C] to-[#E89A6B]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </header>
  );
}
