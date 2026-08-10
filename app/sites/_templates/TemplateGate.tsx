import Image from "next/image";
import { Inter_Tight } from "next/font/google";
import type { CSSProperties } from "react";
import type { SiteData } from "./types";

// Gate / access-control field-services template. Layout follows the common
// field-services pattern: nav + phone strip → hero → offers → services grid
// → four trust badges → three-step flow → service areas → problems solved
// → phone CTA → footer. Copy is original (per-lead via AI or STATIC_FALLBACK).
// Palette defaults to a navy + crimson combo that's standard for the trade;
// each lead can override via the `theme` field on their row.

const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const DEFAULTS = {
  bg: "#0f1e3d",           // deep navy — main background
  bgSurface: "#132648",    // slightly lighter surface for cards
  accent: "#d32f2f",       // crimson — CTA / accent
  accentHover: "#e53935",
  accentContrast: "#ffffff",
  text: "#ffffff",
  textMuted: "#a8b8d1",
} as const;

type ThemeVars = {
  "--t-bg": string;
  "--t-bg-surface": string;
  "--t-accent": string;
  "--t-accent-hover": string;
  "--t-accent-contrast": string;
  "--t-text": string;
  "--t-text-muted": string;
};

function buildThemeVars(data: SiteData): ThemeVars {
  const t = data.theme ?? {};
  return {
    "--t-bg": t.bg ?? DEFAULTS.bg,
    "--t-bg-surface": t.bg ?? DEFAULTS.bgSurface,
    "--t-accent": t.accent ?? DEFAULTS.accent,
    "--t-accent-hover": t.accent ?? DEFAULTS.accentHover,
    "--t-accent-contrast": t.accentContrast ?? DEFAULTS.accentContrast,
    "--t-text": t.text ?? DEFAULTS.text,
    "--t-text-muted": t.textMuted ?? DEFAULTS.textMuted,
  };
}

// Standard offers a gate-repair shop typically runs. Kept as static strings
// because they're campaign-style, not per-business. Swap in per-lead copy
// later if a customer wants different promos.
const OFFERS = [
  { title: "Free remote", sub: "With any new gate opener" },
  { title: "Senior discount", sub: "10% off all service" },
  { title: "Military discount", sub: "For active + veterans" },
  { title: "Refer a friend", sub: "Both get $25 off next visit" },
];

const TRUST_BADGES = [
  { title: "Fast response", sub: "Most jobs booked same day" },
  { title: "Upfront pricing", sub: "Quote before we start" },
  { title: "Licensed techs", sub: "Insured on every visit" },
  { title: "Warranty backed", sub: "On parts and labor" },
];

const FLOW_STEPS = [
  { n: "01", title: "Call or request service", sub: "Tell us what's happening — we can usually give a rough quote on the phone." },
  { n: "02", title: "On-site diagnosis", sub: "Tech arrives in the window, checks the gate, gives you the fixed-fee quote." },
  { n: "03", title: "Repair done right", sub: "We fix it, test the full cycle, walk you through what we did." },
];

const PROBLEMS = [
  "Gate won't open or close",
  "Remote / keypad stopped working",
  "Motor humming but no movement",
  "Chain / belt broken",
  "Off-track slider",
  "Loud grinding on cycle",
  "Circuit board failure",
  "Rusted hinges",
];

export default function TemplateGate({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Call us";
  const cityShort = data.city.split(",")[0];
  const themeStyle = buildThemeVars(data) as unknown as CSSProperties;

  return (
    <div
      style={themeStyle}
      className={`${inter.className} min-h-screen bg-[var(--t-bg)] text-[var(--t-text)]`}
    >
      {/* top strip — brand color, sticky CTA */}
      <div className="bg-[var(--t-accent)] text-[var(--t-accent-contrast)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider">
          <span>Open now · Serving {cityShort} + surrounding areas</span>
          {tel && <a href={`tel:${tel}`} className="hover:underline">☎ {phoneDisplay}</a>}
        </div>
      </div>

      {/* header: logo (if provided) + nav-mimicking pill list + call CTA */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          {data.logoUrl ? (
            <div className="flex items-center gap-3">
              <Image
                src={data.logoUrl}
                alt={`${data.businessName} logo`}
                width={52}
                height={52}
                className="h-12 w-12 rounded bg-white object-contain p-1"
              />
              <span className="hidden text-lg font-extrabold uppercase tracking-tight sm:inline">
                {data.businessName}
              </span>
            </div>
          ) : (
            <div className="text-lg font-extrabold uppercase tracking-tight">
              <span className="rounded bg-[var(--t-accent)] px-2 py-0.5 text-[var(--t-accent-contrast)]">
                {data.businessName}
              </span>
            </div>
          )}
          {tel && (
            <a href={`tel:${tel}`} className="rounded-md bg-[var(--t-accent)] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[var(--t-accent-contrast)] hover:bg-[var(--t-accent-hover)]">
              Request service
            </a>
          )}
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--t-accent)]/40 bg-[var(--t-accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--t-accent)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--t-accent)]" />
              Same-day service · {cityShort}
            </div>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
              {data.headline}
            </h1>
            {data.subheadline && (
              <p className="mt-8 max-w-xl text-lg text-[var(--t-text-muted)]">
                {data.subheadline}
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-4">
              {tel && (
                <a href={`tel:${tel}`} className="inline-flex items-center justify-center rounded-md bg-[var(--t-accent)] px-7 py-4 text-lg font-extrabold uppercase tracking-wider text-[var(--t-accent-contrast)] hover:bg-[var(--t-accent-hover)]">
                  ☎ {phoneDisplay}
                </a>
              )}
              <a href="#book" className="inline-flex items-center justify-center rounded-md border-2 border-current/20 px-7 py-4 text-lg font-bold uppercase tracking-wider text-[var(--t-text)] hover:border-current">
                Request quote
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-[var(--t-accent)]/30 bg-black/20">
              <Image src={data.heroImage} alt={`${data.businessName} crew on-site`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" className={data.coverUrl ? "object-contain" : "object-cover"} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--t-bg)] to-transparent p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--t-accent)]">
                  Trusted across {cityShort}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* stat strip */}
        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-current/10 pt-8 sm:grid-cols-4">
          {[
            [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", "Google reviews"],
            [data.ratingCount ? `${data.ratingCount}+` : "100+", "Jobs completed"],
            ["Same day", "Response window"],
            [cityShort, "Service area"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-3xl font-extrabold text-[var(--t-accent)]">{big}</div>
              <div className="text-xs uppercase tracking-widest text-[var(--t-text-muted)]">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* offers strip */}
      <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">Current offers</h2>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[var(--t-accent)] sm:block">
              Mention on booking
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map((o) => (
              <div key={o.title} className="rounded-lg border border-[var(--t-accent)]/30 bg-[var(--t-bg)] p-6">
                <div className="mb-2 text-xl font-extrabold text-[var(--t-accent)]">{o.title}</div>
                <div className="text-sm text-[var(--t-text-muted)]">{o.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* services grid */}
      <section className="border-t border-current/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Our services.</h2>
          <div className="grid gap-1 border border-current/10 sm:grid-cols-2">
            {data.services.map((s) => (
              <div key={s.title} className="bg-[var(--t-bg-surface)] p-8">
                <div className="mb-3 inline-block bg-[var(--t-accent)] px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[var(--t-accent-contrast)]">{s.title}</div>
                <p className="text-[var(--t-text-muted)]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* trust badges (4-col) */}
      <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Local pros {cityShort} trusts.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="border-l-2 border-[var(--t-accent)] pl-4">
                <div className="mb-1 text-lg font-extrabold uppercase tracking-tight">{b.title}</div>
                <div className="text-sm text-[var(--t-text-muted)]">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-step flow */}
      <section className="border-t border-current/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Simple, from call to done.
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {FLOW_STEPS.map((s) => (
              <div key={s.n}>
                <div className="mb-3 text-5xl font-black text-[var(--t-accent)]">{s.n}</div>
                <div className="mb-2 text-xl font-extrabold uppercase tracking-tight">{s.title}</div>
                <p className="text-[var(--t-text-muted)]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* gallery */}
      <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-10 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Recent work.</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.gallery.map((g) => (
              <figure key={g.cap} className="group relative aspect-square overflow-hidden border border-current/10">
                <Image src={g.src} alt={g.cap} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-[11px] font-bold uppercase tracking-widest text-white">{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* problems we fix */}
      <section className="border-t border-current/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="mb-8 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Problems we fix every day.
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p} className="flex items-center gap-3 rounded border border-current/10 bg-[var(--t-bg-surface)] px-4 py-3">
                <span className="text-[var(--t-accent)]">✓</span>
                <span className="text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* reviews carousel */}
      {data.reviews.length > 0 && (
        <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
                {cityShort} trusts us.
              </h2>
              <div className="hidden text-xs font-bold uppercase tracking-widest text-[var(--t-text-muted)] sm:block">
                {data.reviews.length} verified Google reviews · swipe
              </div>
            </div>
            <div
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5"
              style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
            >
              {data.reviews.map((r) => (
                <figure
                  key={r.name}
                  className="flex min-h-[240px] w-[85%] shrink-0 snap-start flex-col border border-current/10 bg-[var(--t-bg)] p-7 sm:w-[420px]"
                >
                  <div className="mb-3 text-[var(--t-accent)]">★★★★★</div>
                  <blockquote className="flex-1 text-[var(--t-text)]">&ldquo;{r.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 text-xs uppercase tracking-widest text-[var(--t-text-muted)]">
                    {r.name} · Google review
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* about */}
      {data.about && (
        <section className="border-t border-current/10">
          <div className="mx-auto w-full max-w-4xl px-6 py-16">
            <h2 className="mb-6 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">About us.</h2>
            <p className="text-lg text-[var(--t-text-muted)]">{data.about}</p>
          </div>
        </section>
      )}

      {/* final CTA */}
      <section id="book" className="border-t border-current/10 bg-[var(--t-accent)] text-[var(--t-accent-contrast)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
              Gate acting up?
            </h2>
            <p className="mt-3 text-lg font-medium">Get fast, friendly service today.</p>
          </div>
          {tel && (
            <a href={`tel:${tel}`} className="inline-flex items-center justify-center rounded-md bg-[var(--t-bg)] px-8 py-5 text-xl font-extrabold uppercase tracking-wider text-[var(--t-accent)] hover:opacity-90">
              ☎ {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      <footer className="bg-black">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div className="mb-3 text-lg font-extrabold uppercase tracking-tight">
              {data.businessName}
            </div>
            <p className="text-sm text-zinc-500">Licensed. Bonded. Insured.</p>
          </div>
          {data.address && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Address</div>
              <p className="text-sm text-zinc-300">{data.address}</p>
            </div>
          )}
          {tel && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Call</div>
              <a href={`tel:${tel}`} className="text-sm font-bold text-[var(--t-accent)]">{phoneDisplay}</a>
            </div>
          )}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-zinc-600">
            © {new Date().getFullYear()} {data.businessName}
          </div>
        </div>
      </footer>
    </div>
  );
}
