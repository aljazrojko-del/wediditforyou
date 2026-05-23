import type { Metadata } from "next";
import Image from "next/image";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import SampleBanner from "../_components/SampleBanner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1635108201275-b1863fcb9eeb?w=1400&q=80&auto=format&fit=crop";
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1729058015948-592a8e4a1772?w=900&q=80&auto=format&fit=crop",
    cap: "Backyard renovation",
    loc: "Westlake Hills",
  },
  {
    src: "https://images.unsplash.com/photo-1749803915455-a7642520d0d3?w=900&q=80&auto=format&fit=crop",
    cap: "Limestone patio install",
    loc: "Tarrytown",
  },
  {
    src: "https://images.unsplash.com/photo-1728881667082-06be928f08d0?w=900&q=80&auto=format&fit=crop",
    cap: "Lawn restoration",
    loc: "South Austin",
  },
  {
    src: "https://images.unsplash.com/photo-1750682916296-71e66f86171d?w=900&q=80&auto=format&fit=crop",
    cap: "Drought-tolerant front yard",
    loc: "Round Rock",
  },
];

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-greenline",
});

const serif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif-greenline",
});

export const metadata: Metadata = {
  title: "Greenline Landscape Co. — Family-Owned Landscaping in Austin",
  description:
    "Austin yards, done right since 2014. Lawn care, hardscaping, irrigation. Free quotes — licensed and insured.",
};

export default function Greenline() {
  return (
    <div
      className={`${sans.variable} ${serif.variable} min-h-screen bg-[#F4EFE6] text-[#1F2A24]`}
      style={{ fontFamily: "var(--font-sans-greenline)" }}
    >
      <SampleBanner business="Greenline Landscape Co." />

      {/* Header */}
      <header className="border-b border-[#1F2A24]/10 bg-[#F4EFE6]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F3A2E] text-[#F4EFE6]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C9 6 5 8 5 13a7 7 0 0 0 14 0c0-5-4-7-7-11Z" />
              </svg>
            </div>
            <div>
              <div className="font-bold tracking-tight">Greenline</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1F2A24]/60">
                Landscape Co. · Est. 2014
              </div>
            </div>
          </div>
          <a
            href="#quote"
            className="rounded-full bg-[#1F3A2E] px-5 py-2.5 text-sm font-semibold text-[#F4EFE6] hover:bg-[#2b5142]"
          >
            Free quote
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#1F3A2E] text-[#F4EFE6]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:grid-cols-12 sm:py-32">
          <div className="sm:col-span-7">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#F4EFE6]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#E8DCC4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8DCC4]" />
              Family-owned · Licensed · Insured
            </div>
            <h1
              className="text-5xl leading-[1.05] tracking-tight sm:text-7xl"
              style={{ fontFamily: "var(--font-serif-greenline)" }}
            >
              Austin yards,
              <br />
              done right.
            </h1>
            <p className="mt-8 max-w-md text-lg text-[#F4EFE6]/80">
              Mowing, design, hardscape, irrigation — handled by the same
              two-truck crew since 2014. We pick up the phone, show up on time,
              and clean up before we leave.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#quote"
                className="inline-flex items-center justify-center rounded-full bg-[#E8DCC4] px-7 py-4 text-base font-semibold text-[#1F3A2E] hover:bg-[#dccdb0]"
              >
                Get a free quote
              </a>
              <a
                href="tel:+15125550112"
                className="inline-flex items-center justify-center rounded-full border border-[#F4EFE6]/30 px-7 py-4 text-base font-semibold text-[#F4EFE6] hover:border-[#F4EFE6]"
              >
                (512) 555-0112
              </a>
            </div>
          </div>
          <div className="hidden sm:col-span-5 sm:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src={HERO_IMG}
                alt="A landscaped Austin yard by Greenline"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-[#1F2A24]/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#1F3A2E]">
              What we do
            </p>
            <h2
              className="text-4xl tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-serif-greenline)" }}
            >
              Yard work, the way it should be.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                t: "Lawn care",
                d: "Weekly mow, edge, blow. Fertilization and weed control on a calendar that fits Texas heat.",
              },
              {
                t: "Hardscape",
                d: "Patios, walkways, retaining walls. Limestone and flagstone designed for Austin yards.",
              },
              {
                t: "Irrigation",
                d: "Smart controllers, drip lines, water-saving zones. We fix what other crews left behind.",
              },
              {
                t: "Tree & shrub",
                d: "Pruning, planting, removal. ISA-certified arborist on every job over 25 ft.",
              },
            ].map((s, i) => (
              <div
                key={s.t}
                className="rounded-2xl border border-[#1F2A24]/10 bg-white p-7"
              >
                <div className="mb-4 font-mono text-xs text-[#1F3A2E]">
                  0{i + 1}.
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-[#1F2A24]">
                  {s.t}
                </h3>
                <p className="text-sm leading-relaxed text-[#1F2A24]/70">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-[#E8DCC4]/40">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#1F3A2E]">
              Why Greenline
            </p>
            <h2
              className="text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-serif-greenline)" }}
            >
              Same crew. Same trucks. Every visit.
            </h2>
          </div>
          <div className="grid gap-8 sm:col-span-7 sm:grid-cols-2">
            {[
              {
                t: "Family-owned",
                d: "Started by the Hernández brothers in 2014. Still answer the phone themselves.",
              },
              {
                t: "Licensed & insured",
                d: "TX LI #7821. $2M general liability. Bonded for hardscape work.",
              },
              {
                t: "Free quotes",
                d: "We come measure your yard, give you a number, and don't pester you after.",
              },
              {
                t: "Satisfaction guarantee",
                d: "If we miss something, we come back same week. No invoice games.",
              },
            ].map((s) => (
              <div key={s.t}>
                <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1F3A2E] text-xs text-[#F4EFE6]">
                  ✓
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{s.t}</h3>
                <p className="text-sm leading-relaxed text-[#1F2A24]/70">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent projects */}
      <section className="border-t border-[#1F2A24]/10 bg-[#F4EFE6]">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#1F3A2E]">
                Recent work
              </p>
              <h2
                className="text-4xl tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-serif-greenline)" }}
              >
                Yards we&apos;ve loved.
              </h2>
            </div>
            <a
              href="#quote"
              className="text-sm font-semibold text-[#1F3A2E] underline-offset-4 hover:underline"
            >
              See yours next →
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((g) => (
              <figure
                key={g.cap}
                className="group overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={g.src}
                    alt={`${g.cap} in ${g.loc}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <figcaption className="p-5">
                  <div className="text-sm font-bold text-[#1F2A24]">
                    {g.cap}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#1F2A24]/60">
                    {g.loc}, TX
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Quote form */}
      <section id="quote" className="border-t border-[#1F2A24]/10">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#1F3A2E]">
              Free quote
            </p>
            <h2
              className="text-4xl tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-serif-greenline)" }}
            >
              Tell us about your yard.
            </h2>
            <p className="mt-6 max-w-md text-lg text-[#1F2A24]/70">
              Drop your info and we&apos;ll text you within a day to schedule a
              walk-through. No pressure, no pushy follow-ups.
            </p>
            <ul className="mt-10 space-y-3 text-sm text-[#1F2A24]/70">
              <li>· Quote within 48 hours</li>
              <li>· Walk-through is free, even if you don&apos;t book</li>
              <li>· We service all of Greater Austin + Round Rock</li>
            </ul>
          </div>

          <form className="rounded-3xl border border-[#1F2A24]/10 bg-white p-8 sm:p-10">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#1F2A24]">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="rounded-xl border border-[#1F2A24]/15 bg-[#F4EFE6] px-4 py-3 outline-none transition focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#1F2A24]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="rounded-xl border border-[#1F2A24]/15 bg-[#F4EFE6] px-4 py-3 outline-none transition focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#1F2A24]">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="(512) ..."
                  className="rounded-xl border border-[#1F2A24]/15 bg-[#F4EFE6] px-4 py-3 outline-none transition focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[#1F2A24]">
                  Property type
                </label>
                <select className="rounded-xl border border-[#1F2A24]/15 bg-[#F4EFE6] px-4 py-3 outline-none transition focus:border-[#1F3A2E] focus:ring-2 focus:ring-[#1F3A2E]/20">
                  <option>Residential — single family</option>
                  <option>Residential — multi family</option>
                  <option>Commercial</option>
                  <option>HOA / community</option>
                </select>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#1F3A2E] px-6 py-4 text-base font-semibold text-[#F4EFE6] hover:bg-[#2b5142]"
              >
                Request my free quote
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F3A2E] text-[#F4EFE6]/80">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          <div>
            <div className="mb-2 font-bold tracking-tight text-[#F4EFE6]">
              Greenline Landscape Co.
            </div>
            <p className="text-sm text-[#F4EFE6]/60">
              Family-owned. Austin-based. Since 2014.
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#E8DCC4]">
              Reach us
            </div>
            <p className="text-sm">
              (512) 555-0112
              <br />
              hello@greenlinetx.com
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#E8DCC4]">
              Service area
            </div>
            <p className="text-sm">
              Austin · Round Rock · Pflugerville
              <br />
              Cedar Park · Leander · Bee Cave
            </p>
          </div>
        </div>
        <div className="border-t border-[#F4EFE6]/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[#F4EFE6]/40">
            © {new Date().getFullYear()} Greenline Landscape Co. · TX LI #7821
          </div>
        </div>
      </footer>
    </div>
  );
}
