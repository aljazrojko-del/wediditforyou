import type { Metadata } from "next";
import Image from "next/image";
import { Cormorant_Garamond, Inter } from "next/font/google";
import SampleBanner from "../_components/SampleBanner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&q=80&auto=format&fit=crop";
const ABOUT_IMG =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop";
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=900&q=80&auto=format&fit=crop",
    cap: "Honey balayage · summer client",
  },
  {
    src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80&auto=format&fit=crop",
    cap: "Bridal rehearsal · Park Slope",
  },
  {
    src: "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=900&q=80&auto=format&fit=crop",
    cap: "Editorial cut · Brooklyn",
  },
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80&auto=format&fit=crop",
    cap: "Color refresh · root touch-up",
  },
];

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Bella's Hair Studio — Editorial Hair in Brooklyn",
  description:
    "Brooklyn's most-booked balayage studio. Color, cuts, and bridal — by appointment in Park Slope.",
};

export default function BellaHair() {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#FAF6F1] text-[#1A1410]`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <SampleBanner business="Bella's Hair Studio" />

      {/* Top nav */}
      <header className="border-b border-[#1A1410]/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div
            className="text-2xl tracking-tight"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            Bella&apos;s
            <span className="ml-1.5 text-[#C58A7E]">.</span>
          </div>
          <nav className="hidden items-center gap-10 text-xs uppercase tracking-[0.2em] text-[#1A1410]/70 sm:flex">
            <a href="#services" className="hover:text-[#1A1410]">
              Services
            </a>
            <a href="#about" className="hover:text-[#1A1410]">
              About
            </a>
            <a href="#visit" className="hover:text-[#1A1410]">
              Visit
            </a>
          </nav>
          <a
            href="#book"
            className="rounded-full border border-[#1A1410] px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#1A1410] transition hover:bg-[#1A1410] hover:text-[#FAF6F1]"
          >
            Book
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-32 sm:pt-28">
        <p className="mb-8 text-xs uppercase tracking-[0.3em] text-[#C58A7E]">
          — Park Slope, Brooklyn —
        </p>
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1
              className="text-[64px] leading-[0.95] tracking-tight sm:text-[110px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hair, made
              <br />
              <span className="italic text-[#C58A7E]">slowly.</span>
            </h1>
            <p className="mt-10 max-w-md text-lg font-light leading-relaxed text-[#1A1410]/70">
              A small editorial studio for color, cuts, and bridal — by
              appointment only. Take your time. Get a coffee. Leave looking
              like yourself.
            </p>
            <div className="mt-10">
              <a
                href="#book"
                className="group inline-flex items-center gap-3 border-b-2 border-[#1A1410] pb-1 text-sm uppercase tracking-[0.25em] text-[#1A1410]"
              >
                Reserve a chair
                <span className="transition group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={HERO_IMG}
                alt="Editorial hair photograph at Bella's Hair Studio"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[#1A1410]/50">
              — From a recent session
            </p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="border-t border-[#1A1410]/10 bg-[#FAF6F1]">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-14 grid gap-8 sm:grid-cols-12">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C58A7E] sm:col-span-3">
              The book
            </p>
            <h2
              className="text-4xl tracking-tight sm:col-span-9 sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent <span className="italic">work.</span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((g, i) => (
              <figure
                key={g.cap}
                className={`relative ${i % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/5]"} overflow-hidden`}
              >
                <Image
                  src={g.src}
                  alt={g.cap}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1410]/85 to-transparent p-5 text-[11px] uppercase tracking-[0.25em] text-[#FAF6F1]">
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-[#1A1410]/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-16 grid gap-8 sm:grid-cols-12">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C58A7E] sm:col-span-3">
              The menu
            </p>
            <h2
              className="text-5xl tracking-tight sm:col-span-9 sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A short list, done
              <span className="italic"> beautifully.</span>
            </h2>
          </div>

          <div className="grid divide-y divide-[#1A1410]/10 border-y border-[#1A1410]/10">
            {[
              {
                t: "Balayage",
                d: "Hand-painted dimension. Lived-in, low maintenance.",
                p: "from $280",
              },
              {
                t: "Color & gloss",
                d: "Single-process, root touch-ups, glossing treatments.",
                p: "from $140",
              },
              {
                t: "Cuts & styling",
                d: "Editorial cuts, blowouts, and finishing for the everyday.",
                p: "from $95",
              },
              {
                t: "Bridal & events",
                d: "On-location styling for weddings and editorial shoots.",
                p: "by quote",
              },
            ].map((s) => (
              <div
                key={s.t}
                className="grid grid-cols-12 items-baseline gap-4 py-7"
              >
                <div
                  className="col-span-12 text-3xl tracking-tight sm:col-span-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.t}
                </div>
                <div className="col-span-12 max-w-md text-[#1A1410]/70 sm:col-span-6">
                  {s.d}
                </div>
                <div className="col-span-12 text-right text-sm uppercase tracking-[0.2em] text-[#1A1410]/60 sm:col-span-2">
                  {s.p}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-[#1A1410]/10 bg-[#1A1410] text-[#FAF6F1]"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={ABOUT_IMG}
                alt="Bella, owner and stylist"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-[#C58A7E]">
              About
            </p>
            <h2
              className="mb-8 text-5xl tracking-tight sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Eight years.
              <br />
              <span className="italic text-[#C58A7E]">
                Three hundred reviews.
              </span>
            </h2>
            <p className="max-w-xl text-lg font-light leading-relaxed text-[#FAF6F1]/70">
              Bella opened the studio above the bookshop on 5th in 2017. Since
              then, the chair has been booked nearly every weekend by Brooklyn
              brides, editors, and the occasional movie star who wants a
              lived-in blonde without the scene.
            </p>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[#FAF6F1]/70">
              No upsells. No rush. Just one stylist, one chair, one good
              conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-[#1A1410]/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="grid gap-10 sm:grid-cols-3">
            {[
              {
                q: "I drove from Manhattan for a balayage and it was the best decision of my year. Bella *gets* it.",
                n: "Lena R.",
              },
              {
                q: "Quiet, slow, and somehow my hair looks like it grew this way. The whole vibe is uncommercial.",
                n: "Adaeze O.",
              },
              {
                q: "I was a bridal client in May and I still get compliments. Bella is the real deal.",
                n: "Sofia K.",
              },
            ].map((r) => (
              <figure key={r.n}>
                <blockquote
                  className="text-2xl leading-snug tracking-tight text-[#1A1410]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{r.q}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-[0.25em] text-[#1A1410]/60">
                  — {r.n}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section
        id="book"
        className="border-t border-[#1A1410]/10 bg-[#C58A7E]/10"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-6 py-24 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C58A7E]">
              Reservations
            </p>
            <h2
              className="text-5xl tracking-tight sm:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Reserve your
              <br />
              <span className="italic">chair.</span>
            </h2>
          </div>
          <a
            href="mailto:hello@bellashairstudio.com"
            className="inline-flex items-center gap-3 rounded-full bg-[#1A1410] px-8 py-4 text-sm uppercase tracking-[0.2em] text-[#FAF6F1] transition hover:bg-[#2a201a]"
          >
            hello@bellashairstudio.com →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="visit"
        className="border-t border-[#1A1410]/10 bg-[#FAF6F1]"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          <div>
            <div
              className="mb-3 text-2xl tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
              }}
            >
              Bella&apos;s
              <span className="ml-1 text-[#C58A7E]">.</span>
            </div>
            <p className="text-sm text-[#1A1410]/60">
              Park Slope, Brooklyn
              <br />
              By appointment only
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-[#1A1410]/50">
              Visit
            </div>
            <p className="text-sm text-[#1A1410]/80">
              512 5th Avenue, 2nd Floor
              <br />
              Brooklyn, NY 11215
            </p>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-[#1A1410]/50">
              Hours
            </div>
            <p className="text-sm text-[#1A1410]/80">
              Tuesday – Saturday
              <br />
              10a – 7p
            </p>
          </div>
        </div>
        <div className="border-t border-[#1A1410]/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[#1A1410]/40">
            © {new Date().getFullYear()} Bella&apos;s Hair Studio
          </div>
        </div>
      </footer>
    </div>
  );
}
