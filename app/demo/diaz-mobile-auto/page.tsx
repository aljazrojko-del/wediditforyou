import type { Metadata } from "next";
import Image from "next/image";
import { Inter_Tight } from "next/font/google";
import SampleBanner from "../_components/SampleBanner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1600&q=80&auto=format&fit=crop";
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=80&auto=format&fit=crop",
    cap: "Brake job · Katy",
  },
  {
    src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80&auto=format&fit=crop",
    cap: "Battery + alternator · Sugar Land",
  },
  {
    src: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?w=900&q=80&auto=format&fit=crop",
    cap: "Diagnostic + sensor swap · Heights",
  },
  {
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format&fit=crop",
    cap: "Pre-purchase inspection · Spring",
  },
];

const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Diaz Mobile Auto — Houston's Mobile Mechanic. We Come to You.",
  description:
    "ASE-certified mobile mechanic serving Houston metro. Driveway, parking lot, side of the road — we roll to you. Call (832) 555-0190.",
};

const PHONE = "(832) 555-0190";
const PHONE_TEL = "+18325550190";

export default function DiazMobileAuto() {
  return (
    <div className={`${inter.className} min-h-screen bg-[#0F1216] text-white`}>
      <SampleBanner business="Diaz Mobile Auto" />

      {/* Availability ribbon */}
      <div className="bg-[#FF6B00] text-[#0F1216]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider">
          <span>⚙ On-call now · 30 min ETA in Houston metro</span>
          <a href={`tel:${PHONE_TEL}`} className="hover:underline">
            {PHONE}
          </a>
        </div>
      </div>

      {/* Top nav */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
            <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[#0F1216]">
              DIAZ
            </span>
            <span>Mobile Auto</span>
          </div>
          <a
            href={`tel:${PHONE_TEL}`}
            className="rounded-md bg-[#FF6B00] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[#0F1216] hover:bg-orange-400"
          >
            Call now
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#FF6B00]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B00]" />
              ASE certified · Mobile · Upfront pricing
            </div>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
              Houston&apos;s
              <br />
              mobile mechanic.
              <br />
              <span className="text-[#FF6B00]">We come to you.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-zinc-300">
              Won&apos;t start? Brakes grinding? Check engine on? Stay where you
              are — driveway, parking lot, side of the road. We roll to you
              with a fixed price before we touch a wrench.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={`tel:${PHONE_TEL}`}
                className="inline-flex items-center justify-center rounded-md bg-[#FF6B00] px-7 py-4 text-lg font-extrabold uppercase tracking-wider text-[#0F1216] hover:bg-orange-400"
              >
                ☎ {PHONE}
              </a>
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-md border-2 border-white/20 px-7 py-4 text-lg font-bold uppercase tracking-wider text-white hover:border-white"
              >
                Request a quote
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-[#FF6B00]/30">
              <Image
                src={HERO_IMG}
                alt="Mobile mechanic working on a vehicle in a driveway"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1216] to-transparent p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">
                  On-site in 30 min · Houston metro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
          {[
            ["4.9★", "Google reviews"],
            ["6,200+", "Jobs completed"],
            ["30 min", "Avg response"],
            ["ASE", "Certified tech"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-3xl font-extrabold text-[#FF6B00]">
                {big}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-400">
                {small}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-white/10 bg-[#161A20]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            What we fix.
          </h2>
          <div className="grid gap-1 border border-white/10 sm:grid-cols-2">
            {[
              {
                t: "Diagnostics",
                d: "Check-engine, no-start, weird noise. Pro-grade scanner, fixed-fee read.",
              },
              {
                t: "Brakes",
                d: "Pads, rotors, calipers, fluid flush. Same-day, in your driveway.",
              },
              {
                t: "Batteries & alternators",
                d: "Test, swap, charging-system check. Most jobs done in under an hour.",
              },
              {
                t: "Oil + fluids",
                d: "Full synthetic, conventional, transmission, coolant. Filters included.",
              },
              {
                t: "Electrical",
                d: "Starters, sensors, wiring gremlins. We trace the actual cause.",
              },
              {
                t: "Pre-purchase inspection",
                d: "Buying used? 70-point inspection at the seller's curb. PDF report.",
              },
            ].map(({ t, d }) => (
              <div key={t} className="bg-[#0F1216] p-8">
                <div className="mb-3 inline-block bg-[#FF6B00] px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#0F1216]">
                  {t}
                </div>
                <p className="text-zinc-300">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent jobs */}
      <section className="border-t border-white/10 bg-[#161A20]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
              Recent jobs.
            </h2>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[#FF6B00] sm:block">
              This week · Houston metro
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
            Houston trusts us.
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                q: "Battery died in the H-E-B parking lot. Marco was there in 22 minutes with a new one. Flat $185, done.",
                n: "K. Nguyen",
                w: "Sugar Land",
              },
              {
                q: "Quoted me $420 for front pads and rotors. Dealer wanted $890. Same parts. Done in my driveway in 90 min.",
                n: "T. Williams",
                w: "Katy",
              },
              {
                q: "Pre-purchase inspection saved me from a $4k transmission landmine. Worth every dollar.",
                n: "R. Patel",
                w: "Heights",
              },
            ].map((r) => (
              <figure
                key={r.n}
                className="border border-white/10 bg-[#161A20] p-7"
              >
                <div className="mb-3 text-[#FF6B00]">★★★★★</div>
                <blockquote className="text-zinc-200">
                  &ldquo;{r.q}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-widest text-zinc-400">
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
        className="border-t border-white/10 bg-[#FF6B00] text-[#0F1216]"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
              Stuck somewhere?
            </h2>
            <p className="mt-3 text-lg font-medium">
              Tell us where you are. We&apos;ll be there in 30 min.
            </p>
          </div>
          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-flex items-center justify-center rounded-md bg-[#0F1216] px-8 py-5 text-xl font-extrabold uppercase tracking-wider text-[#FF6B00] hover:bg-[#1a1f26]"
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
              <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[#0F1216]">
                DIAZ
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              ASE-certified. Mobile. Upfront pricing, every job.
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Service area
            </div>
            <p className="text-sm text-zinc-300">
              Houston · Katy · Sugar Land
              <br />
              Spring · The Heights · Pearland
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Hours
            </div>
            <p className="text-sm text-zinc-300">
              Mon–Sat 7a–8p
              <br />
              Sunday by appointment
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Call
            </div>
            <a
              href={`tel:${PHONE_TEL}`}
              className="text-sm font-bold text-[#FF6B00]"
            >
              {PHONE}
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-zinc-600">
            © {new Date().getFullYear()} Diaz Mobile Auto LLC · ASE #M2-87104
          </div>
        </div>
      </footer>
    </div>
  );
}
