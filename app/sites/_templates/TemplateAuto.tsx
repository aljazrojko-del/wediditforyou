import Image from "next/image";
import { Inter_Tight } from "next/font/google";
import type { CSSProperties } from "react";
import type { SiteData } from "./types";

const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Default colors — preserve the original dark + orange auto-mechanic vibe
// when the lead has no theme override.
const DEFAULTS = {
  bg: "#0F1216",
  bgSurface: "#161A20",
  accent: "#FF6B00",
  accentHover: "#FFA250",
  accentContrast: "#0F1216",
  text: "#FFFFFF",
  textMuted: "#A0A6B0",
} as const;

// CSS variable wrapper. Tailwind reads these as `bg-[var(--t-...)]`.
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
    "--t-bg-surface": t.bg ?? DEFAULTS.bgSurface, // surface = same family as bg
    "--t-accent": t.accent ?? DEFAULTS.accent,
    "--t-accent-hover": t.accent ?? DEFAULTS.accentHover,
    "--t-accent-contrast": t.accentContrast ?? DEFAULTS.accentContrast,
    "--t-text": t.text ?? DEFAULTS.text,
    "--t-text-muted": t.textMuted ?? DEFAULTS.textMuted,
  };
}

export default function TemplateAuto({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Call us";
  const words = data.businessName.split(/\s+/);
  const shortName = words[0]?.toUpperCase() ?? "AUTO";
  const restOfName = words.slice(1).join(" ");

  const themeStyle = buildThemeVars(data) as unknown as CSSProperties;

  return (
    <div
      style={themeStyle}
      className={`${inter.className} min-h-screen bg-[var(--t-bg)] text-[var(--t-text)]`}
    >
      <div className="bg-[var(--t-accent)] text-[var(--t-accent-contrast)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider">
          <span>⚙ On-call now · 30 min ETA in {data.city}</span>
          {tel && <a href={`tel:${tel}`} className="hover:underline">{phoneDisplay}</a>}
        </div>
      </div>

      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          {/* Real logo swaps in when lead has one; the wordmark fallback keeps
              generic Auto sites branded before we know the customer's mark. */}
          {data.logoUrl ? (
            <div className="flex items-center gap-3">
              <Image
                src={data.logoUrl}
                alt={`${data.businessName} logo`}
                width={56}
                height={56}
                className="h-14 w-14 rounded bg-white object-contain p-1"
              />
              <span className="hidden text-lg font-extrabold uppercase tracking-tight sm:inline">
                {data.businessName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
              <span className="rounded bg-[var(--t-accent)] px-2 py-0.5 text-[var(--t-accent-contrast)]">{shortName}</span>
              {restOfName && <span className="hidden sm:inline">{restOfName}</span>}
            </div>
          )}
          {tel && (
            <a href={`tel:${tel}`} className="rounded-md bg-[var(--t-accent)] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[var(--t-accent-contrast)] hover:bg-[var(--t-accent-hover)]">
              Call now
            </a>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--t-accent)]/40 bg-[var(--t-accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--t-accent)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--t-accent)]" />
              Mobile · Upfront pricing
            </div>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
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
                Request a quote
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className={`relative overflow-hidden rounded-2xl border-2 border-[var(--t-accent)]/30 bg-black/20 ${data.coverUrl ? "aspect-video" : "aspect-[4/5]"}`}>
              {/* Stock heroes fill the frame (cover). A customer's real cover gets
                  a landscape frame + contain (inline style so it can't be purged)
                  so the whole image is visible, not cropped. */}
              <Image src={data.heroImage} alt={`${data.businessName} mobile mechanic`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" style={data.coverUrl ? { objectFit: "contain" } : { objectFit: "cover" }} />
              {/* Stock heroes get the caption overlay; a customer's own cover is
                  left clean (their art already carries the messaging). */}
              {!data.coverUrl && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--t-bg)] to-transparent p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--t-accent)]">
                    On-site in 30 min · {data.city}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-current/10 pt-8 sm:grid-cols-4">
          {[
            [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", "Google reviews"],
            [data.ratingCount ? `${data.ratingCount}+` : "100+", "Jobs completed"],
            ["30 min", "Avg response"],
            [data.city.split(",")[0], "Service area"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-3xl font-extrabold text-[var(--t-accent)]">{big}</div>
              <div className="text-xs uppercase tracking-widest text-[var(--t-text-muted)]">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">What we fix.</h2>
          <div className="grid gap-1 border border-current/10 sm:grid-cols-2">
            {data.services.map((s) => (
              <div key={s.title} className="bg-[var(--t-bg)] p-8">
                <div className="mb-3 inline-block bg-[var(--t-accent)] px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[var(--t-accent-contrast)]">{s.title}</div>
                <p className="text-[var(--t-text-muted)]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-current/10 bg-[var(--t-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Recent jobs.</h2>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[var(--t-accent)] sm:block">This week · {data.city}</span>
          </div>
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

      <section className="border-t border-current/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between gap-4">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">{data.city} trusts us.</h2>
            <div className="hidden text-xs font-bold uppercase tracking-widest text-[var(--t-text-muted)] sm:block">
              {data.reviews.length} verified Google reviews · swipe
            </div>
          </div>
          {/*
            Horizontal review carousel. CSS-only: overflow-x-auto + scroll-snap
            makes each card lock nicely on mobile swipe and desktop drag.
            No JS, no bundler cost, no client component boundary needed.
          */}
          <div
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5"
            style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
          >
            {data.reviews.map((r) => (
              <figure
                key={r.name}
                className="flex min-h-[240px] w-[85%] shrink-0 snap-start flex-col border border-current/10 bg-[var(--t-bg-surface)] p-7 sm:w-[420px]"
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

      <section id="book" className="border-t border-current/10 bg-[var(--t-accent)] text-[var(--t-accent-contrast)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">Stuck somewhere?</h2>
            <p className="mt-3 text-lg font-medium">Tell us where you are. We&apos;ll be there in 30 min.</p>
          </div>
          {tel && (
            <a href={`tel:${tel}`} className="inline-flex items-center justify-center rounded-md bg-[var(--t-bg)] px-8 py-5 text-xl font-extrabold uppercase tracking-wider text-[var(--t-accent)] hover:opacity-90">
              ☎ {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      <footer className="bg-[var(--t-bg)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div className="mb-3 text-lg font-extrabold uppercase tracking-tight">
              <span className="rounded bg-[var(--t-accent)] px-2 py-0.5 text-[var(--t-accent-contrast)]">{shortName}</span>
            </div>
            <p className="text-sm text-[var(--t-text-muted)]">Mobile. Upfront pricing, every job.</p>
          </div>
          {data.address && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--t-text-muted)]">Service area</div>
              <p className="text-sm text-[var(--t-text)]">{data.city}</p>
            </div>
          )}
          {tel && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--t-text-muted)]">Call</div>
              <a href={`tel:${tel}`} className="text-sm font-bold text-[var(--t-accent)]">{phoneDisplay}</a>
            </div>
          )}
        </div>
        <div className="border-t border-current/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[var(--t-text-muted)]">
            © {new Date().getFullYear()} {data.businessName}
          </div>
        </div>
      </footer>
    </div>
  );
}
