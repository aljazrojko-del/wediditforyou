import Image from "next/image";
import CaseStudies from "./components/CaseStudies";
import ContactForm from "./components/ContactForm";
import CountUp from "./components/CountUp";
import Founder from "./components/Founder";
import Hero3D from "./components/Hero3D";
import HeroText from "./components/HeroText";
import Marquee from "./components/Marquee";
import Promises from "./components/Promises";
import SampleBuilds from "./components/SampleBuilds";
import ScrollReveal from "./components/ScrollReveal";
import StatsStrip from "./components/StatsStrip";
import StickyNav from "./components/StickyNav";

const FOCUS_NICHES = [
  {
    label: "Mobile mechanics",
    blurb:
      "Same-day fixes at the customer's driveway. Bookings, quotes, service area — all live on the site.",
    src: "https://images.unsplash.com/photo-1632733711679-529326f6db12?w=900&q=80&auto=format&fit=crop",
  },
  {
    label: "Mobile dog groomers",
    blurb:
      "Door-to-door grooming routes. Online booking, breed-specific service menu, your van and your photos.",
    src: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=900&q=80&auto=format&fit=crop",
  },
  {
    label: "Tutors",
    blurb:
      "Subjects, levels, parent-friendly booking. Built to win Google searches in your local district.",
    src: "https://images.unsplash.com/photo-1583468991267-3f068b607ae1?w=900&q=80&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="flex w-full flex-1 flex-col bg-[#FAF6F0] text-[#1F1814]">
      <StickyNav />
      <Marquee />

      {/* Hero — wrapped in a relative container so we can drop colored shapes behind it */}
      <div className="relative overflow-hidden">
        {/* Decorative warm color blobs (brand palette only, behind content) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#E89A6B] opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full bg-[#C2410C] opacity-20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[#F0E9DC] opacity-60 blur-3xl"
        />

        <section
          id="top"
          className="relative mx-auto w-full max-w-6xl px-6 pt-6 pb-10 sm:pt-10 sm:pb-12"
        >
          <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <HeroText />
            </div>

            <div className="lg:col-span-5">
              <Hero3D />
              <p className="mt-3 text-center text-xs text-[#1F1814]/50 lg:text-left">
                Three real client previews — hover to look around
              </p>
            </div>
          </div>
        </section>
      </div>

      <StatsStrip />

      <Founder />

      <Promises />

      {/* Who we build for */}
      <section className="border-t border-[#1F1814]/10 bg-[#F0E9DC]">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
          <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
              Who we build for
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              We specialize in three kinds of business right now.
            </h2>
            <p className="mt-4 text-base text-[#1F1814]/65">
              Each one runs on bookings. Each one is invisible on Google
              without a site. Each one we&apos;ve already templated and tuned.
            </p>
          </ScrollReveal>

          <ScrollReveal
            className="grid gap-6 sm:grid-cols-3"
            variant="stagger"
            staggerSelector="article"
          >
            {FOCUS_NICHES.map((n) => (
              <article
                key={n.label}
                className="group overflow-hidden rounded-3xl border border-[#1F1814]/10 bg-white transition hover:-translate-y-1 hover:border-[#C2410C]/40 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={n.src}
                    alt={`${n.label} — businesses we specialize in`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2410C] backdrop-blur">
                    Focus niche
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1F1814]">
                    {n.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#1F1814]/70">
                    {n.blurb}
                  </p>
                </div>
              </article>
            ))}
          </ScrollReveal>

          <p className="mt-8 max-w-2xl text-sm text-[#1F1814]/55">
            Three niches. Three templates. No exceptions until we&apos;ve closed
            ten clients in each. Focused beats general — your site is built by
            someone who&apos;s built fifty just like it.
          </p>
        </div>
      </section>

      {/* What we do / How it works */}
      <section id="how" className="border-t border-[#1F1814]/10 bg-[#FAF6F0]">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
          <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
              What we do
            </p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Three steps. Most of them are already done.
            </h2>
          </ScrollReveal>

          <ScrollReveal
            as="ol"
            className="grid gap-6 sm:grid-cols-3"
            variant="stagger"
            staggerSelector="li"
          >
            <li className="group relative flex flex-col rounded-2xl border border-[#1F1814]/10 bg-white p-8 transition hover:border-[#C2410C]/60">
              <span className="mb-6 font-mono text-sm font-semibold text-[#C2410C]">
                01
              </span>
              <h3 className="text-xl font-semibold text-[#1F1814]">
                We find you, then we build it.
              </h3>
              <p className="mt-3 text-[#1F1814]/70">
                We research your business — Google, social, reviews — and design
                a finished site around how you actually run it. No questionnaire.
                No back-and-forth.
              </p>
            </li>

            <li className="group relative flex flex-col rounded-2xl border border-[#1F1814]/10 bg-white p-8 transition hover:border-[#C2410C]/60">
              <span className="mb-6 font-mono text-sm font-semibold text-[#C2410C]">
                02
              </span>
              <h3 className="text-xl font-semibold text-[#1F1814]">
                We reach out personally.
              </h3>
              <p className="mt-3 text-[#1F1814]/70">
                We call or email you with a live URL of the site we&apos;ve
                already built for you. No pitch deck — you just look at it and
                decide.
              </p>
            </li>

            <li className="group relative flex flex-col rounded-2xl border border-[#1F1814]/10 bg-white p-8 transition hover:border-[#C2410C]/60">
              <span className="mb-6 font-mono text-sm font-semibold text-[#C2410C]">
                03
              </span>
              <h3 className="text-xl font-semibold text-[#1F1814]">
                You review, we ship.
              </h3>
              <p className="mt-3 text-[#1F1814]/70">
                If you want it, we hop on a quick review call, polish the
                details to match your brand, and agree on a price. Then it
                goes live.
              </p>
            </li>
          </ScrollReveal>
        </div>
      </section>

      <SampleBuilds />

      <CaseStudies />

      {/* Contact */}
      <section
        id="contact"
        className="border-t border-[#1F1814]/10 bg-[#FAF6F0]"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-10 sm:py-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
              Skip the wait
            </p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Don&apos;t want to wait for our call?
            </h2>
            <p className="mt-6 max-w-md text-lg text-[#1F1814]/70">
              Tell us a little about your business and we&apos;ll build yours
              next — matched to your niche, your style, your customers.
              You&apos;ll hear back within 24 hours with a live URL.
            </p>
            <ul className="mt-10 space-y-3 text-sm text-[#1F1814]/70">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                Built around your niche, not a generic template
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                No deposit until you approve the site
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                Live URL within 24 hours
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                Walk away if it&apos;s not right — keep the draft
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#1F1814]/10 bg-white p-8 sm:p-10">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t border-[#1F1814]/10 bg-[#1F1814] text-[#FAF6F0]"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
          <ScrollReveal
            className="mx-auto mb-8 max-w-2xl text-center sm:mb-10"
            variant="fade-up"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#E89A6B]">
              Pricing
            </p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Two ways to launch.
            </h2>
            <p className="mt-6 text-lg text-[#FAF6F0]/70">
              Start with the basics, or get the full premium stack with SEO,
              booking, and customer-review automation built in.
            </p>
          </ScrollReveal>

          {/* Scarcity badge above the tiers */}
          <ScrollReveal
            className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-3"
            variant="fade-up"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-[#FAF6F0]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E89A6B]" />
              8 of 10 founding spots remain · prices lock when full
            </div>
            <div
              className="grid max-w-sm grid-cols-10 gap-1.5"
              aria-label="2 of 10 founding-client spots claimed"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full ${i < 2 ? "bg-[#C2410C]" : "border border-[#FAF6F0]/15 bg-[#FAF6F0]/5"}`}
                />
              ))}
            </div>
          </ScrollReveal>

          {/* Two-tier pricing grid */}
          <ScrollReveal
            className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2"
            variant="stagger"
            staggerSelector=".tier-card"
          >
            {/* STARTER */}
            <div className="tier-card flex flex-col overflow-hidden rounded-3xl border border-[#FAF6F0]/10 bg-[#FAF6F0] text-[#1F1814] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
              <div className="px-7 pt-9 pb-6 sm:px-9">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full border border-[#1F1814]/15 bg-[#1F1814]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#1F1814]/70">
                    Starter
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-[#1F1814]/55">
                    $
                  </span>
                  <span className="text-6xl font-semibold leading-none tracking-tight text-[#1F1814]">
                    297
                  </span>
                  <span className="ml-1 text-sm text-[#1F1814]/55">
                    one-time
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#1F1814]/65">
                  The fundamentals to be findable on Google. Pay $0 until you
                  approve.
                </p>
              </div>

              <div className="flex flex-1 flex-col border-t border-[#1F1814]/10 px-7 py-7 sm:px-9">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#1F1814]/55">
                  What&apos;s included
                </div>
                <ul className="grid gap-3">
                  {[
                    "Full custom website, built around your business",
                    "Custom domain — registered, DNS pointed, live",
                    "Hosting + SSL — zero config on your end",
                    "Booking calendar wired to your phone & email",
                    "One review call to polish before going live",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[14px] leading-relaxed text-[#1F1814]/85"
                    >
                      <span className="mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#1F1814]/10 text-[10px] font-bold text-[#1F1814]/70">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className="mt-auto pt-7 text-[15px] font-semibold text-[#1F1814] hover:underline"
                >
                  Build my starter site →
                </a>
              </div>
            </div>

            {/* PREMIUM — highlighted */}
            <div className="tier-card relative flex flex-col overflow-hidden rounded-3xl border-2 border-[#C2410C] bg-[#FAF6F0] text-[#1F1814] shadow-[0_40px_100px_-20px_rgba(194,65,12,0.45)]">
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#C2410C] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                Most popular
              </div>

              <div className="px-7 pt-9 pb-6 sm:px-9">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-[#C2410C] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                    Premium
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-[#1F1814]/55">
                    $
                  </span>
                  <span className="text-6xl font-semibold leading-none tracking-tight text-[#1F1814]">
                    797
                  </span>
                  <span className="ml-1 text-sm text-[#1F1814]/55">
                    one-time
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#1F1814]/70">
                  Everything in Starter, plus the SEO + automation that turns
                  the site into a lead machine.
                </p>
              </div>

              <div className="flex flex-1 flex-col border-t border-[#1F1814]/10 px-7 py-7 sm:px-9">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#C2410C]">
                  Everything in Starter, plus
                </div>
                <ul className="grid gap-3">
                  {[
                    { label: "Custom logo + brand identity (color palette, fonts)", value: 300 },
                    { label: "5 service-specific pages — ranks for each service on Google", value: 600 },
                    { label: "Google Business Profile fully optimized", value: 400 },
                    { label: "Listed on 5 directories (Yelp, BBB, Nextdoor, Bing, Yellow Pages)", value: 250 },
                    { label: "Online booking with service menu + pricing", value: 300 },
                    { label: "Auto-review collection — text customers after each job", value: 250 },
                    { label: "Monthly performance report — visits, calls, bookings", value: 200 },
                    { label: "90-day priority support (vs. 30 days for Starter)", value: 300 },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-3 text-[14px] leading-relaxed text-[#1F1814]/90"
                    >
                      <span className="mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#C2410C]/15 text-[10px] font-bold text-[#C2410C]">
                        ✓
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <span className="font-mono text-xs tabular-nums text-[#1F1814]/40">
                        ${item.value}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Value stack callout */}
                <div className="mt-6 rounded-2xl bg-[#1F1814] p-5 text-[#FAF6F0]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-[0.2em] text-[#FAF6F0]/55">
                      Stack value
                    </span>
                    <span className="font-mono text-sm text-[#FAF6F0]/55 line-through">
                      $2,600
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#FAF6F0]">
                      Founding price
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#E89A6B]">
                      $797
                    </span>
                  </div>
                  <div className="mt-2 border-t border-[#FAF6F0]/15 pt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FAF6F0]/70">
                        You save
                      </span>
                      <span className="font-mono text-xl font-bold text-[#E89A6B]">
                        $1,803
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href="#contact"
                  className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#9A3412]"
                >
                  Go premium — $797 →
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Shared guarantee */}
          <ScrollReveal
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#FAF6F0]/10 bg-[#FAF6F0]/5 p-7 text-center"
            variant="fade-up"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E89A6B]">
              Same guarantee on both tiers
            </p>
            <p className="mt-3 text-base font-semibold text-[#FAF6F0]">
              Zero customer inquiries in 30 days? Full refund. Keep the site.
            </p>
            <p className="mt-2 text-sm text-[#FAF6F0]/65">
              We build before you pay. If you don&apos;t love it, walk away
              with the draft — owe nothing.
            </p>
          </ScrollReveal>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-[#FAF6F0]/55">
            For most local businesses, a custom website costs $1,500–$5,000.
            We create yours first so you can see exactly what you&apos;re
            paying for.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1F1814]/10 bg-[#F0E9DC]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <div className="font-mono text-sm text-[#1F1814]/60">
            wediditforyou<span className="text-[#C2410C]">.</span> — websites,
            already built.
          </div>
          <div className="text-sm text-[#1F1814]/40">
            © {new Date().getFullYear()} wediditforyou. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
