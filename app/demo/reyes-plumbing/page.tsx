import type { Metadata } from "next";
import Image from "next/image";
import { Inter_Tight } from "next/font/google";
import SampleBanner from "../_components/SampleBanner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?w=1600&q=80&auto=format&fit=crop";
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?w=900&q=80&auto=format&fit=crop",
    cap: "Drain line replacement · Encanto",
  },
  {
    src: "https://images.unsplash.com/photo-1542013936693-884638332954?w=900&q=80&auto=format&fit=crop",
    cap: "Tankless water heater · Tempe",
  },
  {
    src: "https://images.unsplash.com/photo-1676210133055-eab6ef033ce3?w=900&q=80&auto=format&fit=crop",
    cap: "Repipe job · North Phoenix",
  },
  {
    src: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=900&q=80&auto=format&fit=crop",
    cap: "Emergency leak repair · Glendale",
  },
];

const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Reyes Plumbing & Drain — 24/7 Emergency Plumbing in Phoenix",
  description:
    "Phoenix's same-day plumbing crew. Licensed, bonded, insured. Call (602) 555-0143 — we're 8 minutes away.",
};

const PHONE = "(602) 555-0143";
const PHONE_TEL = "+16025550143";

export default function ReyesPlumbing() {
  return (
    <div className={`${inter.className} min-h-screen bg-[#0A1F44] text-white`}>
      <SampleBanner business="Reyes Plumbing & Drain" />

      {/* Emergency call ribbon */}
      <div className="bg-[#FBBF24] text-[#0A1F44]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider">
          <span>⚡ 24/7 emergency line</span>
          <a href={`tel:${PHONE_TEL}`} className="hover:underline">
            {PHONE}
          </a>
        </div>
      </div>

      {/* Top nav */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
            <span className="rounded bg-[#FBBF24] px-2 py-0.5 text-[#0A1F44]">
              REYES
            </span>
            <span>Plumbing &amp; Drain</span>
          </div>
          <a
            href={`tel:${PHONE_TEL}`}
            className="rounded-md bg-[#FBBF24] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[#0A1F44] hover:bg-yellow-300"
          >
            Call now
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#FBBF24]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FBBF24]" />
              Available now · 8 min response time
            </div>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
              Phoenix
              <br />
              plumbing.
              <br />
              <span className="text-[#FBBF24]">Done right.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-blue-100/80">
              Burst pipe? Backed-up drain? No hot water? Call us — we&apos;ll
              be at your door in under an hour with a fixed price before we
              lift a wrench.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={`tel:${PHONE_TEL}`}
                className="inline-flex items-center justify-center rounded-md bg-[#FBBF24] px-7 py-4 text-lg font-extrabold uppercase tracking-wider text-[#0A1F44] hover:bg-yellow-300"
              >
                ☎ {PHONE}
              </a>
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-md border-2 border-white/20 px-7 py-4 text-lg font-bold uppercase tracking-wider text-white hover:border-white"
              >
                Book online
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-[#FBBF24]/30">
              <Image
                src={HERO_IMG}
                alt="Reyes Plumbing technician working under a sink"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1F44] to-transparent p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#FBBF24]">
                  On-site in 8 min · Phoenix metro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
          {[
            ["4.9★", "Google reviews"],
            ["10k+", "Jobs completed"],
            ["24/7", "Emergency calls"],
            ["A+", "BBB accredited"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-3xl font-extrabold text-[#FBBF24]">
                {big}
              </div>
              <div className="text-xs uppercase tracking-widest text-blue-200/60">
                {small}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-white/10 bg-[#081634]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            What we fix.
          </h2>
          <div className="grid gap-1 border border-white/10 sm:grid-cols-2">
            {[
              {
                t: "Emergency repairs",
                d: "Burst pipes, leaks, no water — we roll same hour, 24/7.",
              },
              {
                t: "Drain cleaning",
                d: "Hydro-jetting, snaking, root removal. Fixed price, guaranteed.",
              },
              {
                t: "Water heaters",
                d: "Tank, tankless, gas, electric. Repair or full replacement.",
              },
              {
                t: "Repipes & remodels",
                d: "Whole-house repipes, kitchen and bath rough-ins.",
              },
            ].map(({ t, d }) => (
              <div key={t} className="bg-[#0A1F44] p-8">
                <div className="mb-3 inline-block bg-[#FBBF24] px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#0A1F44]">
                  {t}
                </div>
                <p className="text-blue-100/80">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent jobs */}
      <section className="border-t border-white/10 bg-[#081634]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
              Recent jobs.
            </h2>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[#FBBF24] sm:block">
              This week · Phoenix metro
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((g) => (
              <figure
                key={g.cap}
                className="group relative aspect-square overflow-hidden border border-white/10"
              >
                <Image
                  src={g.src}
                  alt={g.cap}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-[11px] font-bold uppercase tracking-widest text-white">
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Phoenix trusts us.
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                q: "Pipe burst at 11pm. They were here by midnight, fixed by 1am. Saved my floors.",
                n: "M. Alvarez",
                w: "Glendale",
              },
              {
                q: "Quoted us a flat $340 for a water heater swap. Three other guys wanted $700+. Done in 90 min.",
                n: "J. Patel",
                w: "Tempe",
              },
              {
                q: "These guys actually pick up the phone. That alone is worth 5 stars in this town.",
                n: "C. Romero",
                w: "Phoenix",
              },
            ].map((r) => (
              <figure
                key={r.n}
                className="border border-white/10 bg-[#081634] p-7"
              >
                <div className="mb-3 text-[#FBBF24]">★★★★★</div>
                <blockquote className="text-blue-100">
                  &ldquo;{r.q}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-widest text-blue-200/60">
                  {r.n} · {r.w}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="book"
        className="border-t border-white/10 bg-[#FBBF24] text-[#0A1F44]"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
              Got a leak right now?
            </h2>
            <p className="mt-3 text-lg font-medium">
              We&apos;re 8 minutes away. Call before it gets worse.
            </p>
          </div>
          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-flex items-center justify-center rounded-md bg-[#0A1F44] px-8 py-5 text-xl font-extrabold uppercase tracking-wider text-[#FBBF24] hover:bg-[#0d2557]"
          >
            ☎ {PHONE}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-4">
          <div>
            <div className="mb-3 text-lg font-extrabold uppercase tracking-tight">
              <span className="rounded bg-[#FBBF24] px-2 py-0.5 text-[#0A1F44]">
                REYES
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Family-owned. Licensed. Bonded. Insured.
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Address
            </div>
            <p className="text-sm text-zinc-300">
              4280 W Indian School Rd
              <br />
              Phoenix, AZ 85031
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Hours
            </div>
            <p className="text-sm text-zinc-300">
              24/7 emergency
              <br />
              Office Mon–Sat 7a–7p
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Call
            </div>
            <a
              href={`tel:${PHONE_TEL}`}
              className="text-sm font-bold text-[#FBBF24]"
            >
              {PHONE}
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-zinc-600">
            © {new Date().getFullYear()} Reyes Plumbing &amp; Drain LLC ·
            ROC#287104
          </div>
        </div>
      </footer>
    </div>
  );
}
