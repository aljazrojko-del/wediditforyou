"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CARDS = [
  {
    href: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000&q=80&auto=format&fit=crop",
    domain: "bellahair.wediditforyou.com",
    headline: "Hair, made slowly.",
    chip: "Reserve a chair →",
    chipBg: "#FFFFFF",
    chipFg: "#1F1814",
    headlineFont: "Georgia, serif",
    accent: "#F4C09E",
    rotation: -7,
    translateX: -42,
    translateY: 24,
    translateZ: -60,
    layer: 1,
  },
  {
    href: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1000&q=80&auto=format&fit=crop",
    domain: "diazmobile.wediditforyou.com",
    headline: "Houston's mobile mechanic. We come to you.",
    chip: "Call now →",
    chipBg: "#FF6B00",
    chipFg: "#0F1216",
    headlineFont: "Inter Tight, system-ui, sans-serif",
    headlineWeight: 800,
    headlineTransform: "uppercase" as const,
    accent: "#FF6B00",
    rotation: 4,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    layer: 2,
  },
  {
    href: "https://images.unsplash.com/photo-1635108201275-b1863fcb9eeb?w=1000&q=80&auto=format&fit=crop",
    domain: "greenline.wediditforyou.com",
    headline: "Austin yards, done right.",
    chip: "Get a quote →",
    chipBg: "#E8DCC4",
    chipFg: "#1F3A2E",
    headlineFont: "DM Serif Display, Georgia, serif",
    accent: "#E8DCC4",
    rotation: 9,
    translateX: 38,
    translateY: 32,
    translateZ: -100,
    layer: 0,
  },
];

export default function Hero3D() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Initial entrance — cards fly in
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          opacity: 0,
          y: 60,
          rotateY: -25,
          duration: 0.9,
          delay: 0.2 + i * 0.12,
          ease: "power3.out",
        });
      });

      // Mouse parallax
      const onMove = (e: MouseEvent) => {
        const rect = stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = (e.clientX - cx) / rect.width;
        const y = (e.clientY - cy) / rect.height;

        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          const depth = (i - 1) * 12; // -12, 0, 12
          gsap.to(card, {
            x: x * (20 + depth),
            y: y * (12 + depth * 0.5),
            rotateY: x * -8,
            rotateX: y * 6,
            duration: 0.8,
            ease: "power2.out",
          });
        });
      };

      const onLeave = () => {
        cardsRef.current.forEach((card) => {
          if (!card) return;
          gsap.to(card, {
            x: 0,
            y: 0,
            rotateY: 0,
            rotateX: 0,
            duration: 1.2,
            ease: "power3.out",
          });
        });
      };

      stage.addEventListener("mousemove", onMove);
      stage.addEventListener("mouseleave", onLeave);
      return () => {
        stage.removeEventListener("mousemove", onMove);
        stage.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: stageRef },
  );

  return (
    <div
      ref={stageRef}
      className="relative mx-auto h-[420px] w-full max-w-md overflow-hidden sm:h-[520px] lg:max-w-none"
      style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
    >
      {CARDS.map((c, i) => (
        <div
          key={c.domain}
          ref={(el) => {
            cardsRef.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 w-[78%] sm:w-[72%]"
          style={{
            transform: `translate(-50%, -50%) translate3d(${c.translateX}%, ${c.translateY}px, ${c.translateZ}px) rotateZ(${c.rotation}deg)`,
            zIndex: c.layer,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-[#1F1814]/10 bg-white shadow-[0_30px_80px_-20px_rgba(31,24,20,0.35)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-[#1F1814]/10 bg-[#F0E9DC] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
              <span className="ml-3 truncate font-mono text-[10px] text-[#1F1814]/50">
                {c.domain}
              </span>
            </div>
            {/* Site preview */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={c.href}
                alt={`${c.domain} preview`}
                fill
                priority={i === 1}
                sizes="(max-width: 1024px) 80vw, 35vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5">
                <div
                  className="text-2xl leading-tight text-white sm:text-3xl"
                  style={{
                    fontFamily: c.headlineFont,
                    fontWeight: c.headlineWeight ?? 600,
                    textTransform: c.headlineTransform,
                  }}
                >
                  {c.headline}
                </div>
                <div
                  className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{
                    background: c.chipBg,
                    color: c.chipFg,
                  }}
                >
                  {c.chip}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
