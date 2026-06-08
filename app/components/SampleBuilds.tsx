import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

type Build = {
  href: string;
  business: string;
  niche: string;
  city: string;
  domain: string;
  imgSrc: string;
  headline: string;
  chip: string;
  chipBg: string;
  chipFg: string;
  headlineFont?: string;
  headlineWeight?: number;
  headlineTransform?: "uppercase" | "none";
};

const BUILDS: Build[] = [
  {
    href: "/demo/diaz-mobile-auto",
    business: "Diaz Mobile Auto",
    niche: "Mobile mechanic",
    city: "Houston, TX",
    domain: "diazmobile.wediditforyou.com",
    imgSrc:
      "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1400&q=80&auto=format&fit=crop",
    headline: "Houston's mobile mechanic. We come to you.",
    chip: "Call now",
    chipBg: "#FF6B00",
    chipFg: "#0F1216",
    headlineFont: "Inter Tight, system-ui, sans-serif",
    headlineWeight: 800,
    headlineTransform: "uppercase",
  },
  {
    href: "/demo/greenline-landscape",
    business: "Greenline Landscape Co.",
    niche: "Landscaper",
    city: "Austin, TX",
    domain: "greenline.wediditforyou.com",
    imgSrc:
      "https://images.unsplash.com/photo-1635108201275-b1863fcb9eeb?w=1400&q=80&auto=format&fit=crop",
    headline: "Austin yards, done right since 2014.",
    chip: "Get a free quote →",
    chipBg: "#E8DCC4",
    chipFg: "#1F3A2E",
    headlineFont: "DM Serif Display, Georgia, serif",
    headlineWeight: 400,
  },
  {
    href: "/demo/reyes-plumbing",
    business: "Reyes Plumbing & Drain",
    niche: "Plumber",
    city: "Phoenix, AZ",
    domain: "reyesplumbing.wediditforyou.com",
    imgSrc:
      "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?w=1400&q=80&auto=format&fit=crop",
    headline: "Phoenix plumbing. Done right.",
    chip: "Call now",
    chipBg: "#FBBF24",
    chipFg: "#0A1F44",
    headlineFont: "Inter Tight, system-ui, sans-serif",
    headlineWeight: 800,
    headlineTransform: "uppercase",
  },
  {
    href: "/demo/bellas-hair-studio",
    business: "Bella's Hair Studio",
    niche: "Salon",
    city: "Brooklyn, NY",
    domain: "bellahair.wediditforyou.com",
    imgSrc:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&q=80&auto=format&fit=crop",
    headline: "Hair, made slowly.",
    chip: "Reserve a chair →",
    chipBg: "#FAF6F0",
    chipFg: "#1F1814",
    headlineFont: "Cormorant Garamond, Georgia, serif",
    headlineWeight: 500,
  },
];

export default function SampleBuilds() {
  return (
    <section
      id="work"
      className="border-t border-[#1F1814]/10 bg-[#F0E9DC]"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
            Sample builds
          </p>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Sites we&apos;ve already built. Yours would be next.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-[#1F1814]/70">
            Each preview below is a live site we built on spec for a real local
            business — different niche, different design, different feel. Click
            any to walk through it.
          </p>
        </ScrollReveal>

        <ScrollReveal
          className="grid gap-6 lg:grid-cols-2"
          variant="stagger"
          staggerSelector="a"
        >
          {BUILDS.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group relative block overflow-hidden rounded-3xl border border-[#1F1814]/10 bg-white shadow-[0_20px_60px_-30px_rgba(31,24,20,0.35)] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(31,24,20,0.45)]"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 border-b border-[#1F1814]/10 bg-[#F0E9DC] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#1F1814]/15" />
                <span className="ml-3 truncate font-mono text-[10px] text-[#1F1814]/50">
                  {b.domain}
                </span>
              </div>

              {/* Photo + overlay */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={b.imgSrc}
                  alt={`${b.business} site preview`}
                  fill
                  sizes="(max-width: 1024px) 95vw, 45vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <div
                    className="text-2xl leading-tight text-white sm:text-3xl"
                    style={{
                      fontFamily: b.headlineFont,
                      fontWeight: b.headlineWeight ?? 600,
                      textTransform: b.headlineTransform ?? "none",
                    }}
                  >
                    {b.headline}
                  </div>
                  <div
                    className="mt-4 inline-block rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest"
                    style={{ background: b.chipBg, color: b.chipFg }}
                  >
                    {b.chip}
                  </div>
                </div>
              </div>

              {/* Card meta */}
              <div className="flex items-center justify-between p-6">
                <div>
                  <div className="text-base font-semibold text-[#1F1814]">
                    {b.business}
                  </div>
                  <div className="text-xs text-[#1F1814]/55">
                    {b.niche} · {b.city}
                  </div>
                </div>
                <span className="rounded-full border border-[#1F1814]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#1F1814]/60 transition group-hover:border-[#C2410C]/60 group-hover:text-[#C2410C]">
                  Walk through →
                </span>
              </div>
            </Link>
          ))}
        </ScrollReveal>

        <p className="mt-8 text-sm text-[#1F1814]/60">
          These are demo builds, not paying clients — yet. Want to be the
          first?{" "}
          <a
            href="#contact"
            className="font-semibold text-[#C2410C] underline-offset-4 hover:underline"
          >
            Tell us about your business.
          </a>
        </p>
      </div>
    </section>
  );
}
