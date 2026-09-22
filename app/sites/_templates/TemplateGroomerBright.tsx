import Image from "next/image";
import { Poppins, Inter } from "next/font/google";
import type { CSSProperties } from "react";
import type { SiteData } from "./types";

// Bright, cheerful premium pet-spa template — inspired by top mobile-grooming
// sites (sherbet/coral hues, cream backgrounds, rounded friendly shapes, playful
// pastel accents, generous whitespace). Light by default; lead theme can override.
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

const DEFAULTS = {
  bg: "#FFF7F1", accent: "#FF7A59", accentContrast: "#FFFFFF",
  text: "#2C221E", textMuted: "#8B7A72",
} as const;
// Fixed playful pastels (not part of the Theme contract) tint the service cards.
const PASTELS = ["#FFE3D8", "#DFF3EC", "#E7ECFF", "#FFF0D6", "#FBE2EC", "#E9F7DF"];

type ThemeVars = {
  "--g-bg": string; "--g-accent": string; "--g-accent-contrast": string; "--g-text": string; "--g-muted": string;
};
function buildTheme(data: SiteData): ThemeVars {
  const t = data.theme ?? {};
  return {
    "--g-bg": t.bg ?? DEFAULTS.bg,
    "--g-accent": t.accent ?? DEFAULTS.accent,
    "--g-accent-contrast": t.accentContrast ?? DEFAULTS.accentContrast,
    "--g-text": t.text ?? DEFAULTS.text,
    "--g-muted": t.textMuted ?? DEFAULTS.textMuted,
  };
}

const EMOJI = ["🛁", "✂️", "🐾", "✨", "💛", "🦴"];

export default function TemplateGroomerBright({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Call us";
  const city = data.city.split(",")[0];
  const themeStyle = buildTheme(data) as unknown as CSSProperties;

  return (
    <div style={themeStyle} className={`${inter.className} min-h-screen bg-[var(--g-bg)] text-[var(--g-text)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gUp { from { opacity:0; transform: translateY(26px);} to { opacity:1; transform:none;} }
        @keyframes gFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-10px);} }
        @keyframes gScroll { from { transform: translateX(0);} to { transform: translateX(-50%);} }
        @media (prefers-reduced-motion: reduce){ .g-up,.g-float,.g-track{ animation:none !important; } }
        .g-up { opacity:0; animation: gUp .8s cubic-bezier(.16,1,.3,1) forwards; }
        .g-float { animation: gFloat 5s ease-in-out infinite; }
        .g-marquee { overflow:hidden; -webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); }
        .g-track { display:flex; width:max-content; animation: gScroll 24s linear infinite; }
        .g-card { transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; }
        .g-card:hover { transform: translateY(-6px); box-shadow: 0 22px 50px -22px rgba(255,122,89,.45); }
        .g-figure:hover img { transform: scale(1.07); }
        .g-figure img { transition: transform .6s cubic-bezier(.16,1,.3,1); }
      `}} />

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          {data.logoUrl ? (
            <Image src={data.logoUrl} alt={data.businessName} width={44} height={44} className="h-11 w-11 rounded-full bg-white object-contain p-1 shadow" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--g-accent)] text-lg text-white shadow-sm">🐾</span>
          )}
          <span className={`${poppins.className} text-lg font-700 font-semibold tracking-tight`}>{data.businessName}</span>
        </div>
        {tel && (
          <a href={`tel:${tel}`} className="rounded-full bg-[var(--g-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--g-accent-contrast)] shadow-sm transition hover:brightness-105">
            Book now
          </a>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* soft pastel blobs */}
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#FFD9CB] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-[#D5EEFF] opacity-60 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:gap-8 lg:pt-16">
          <div>
            <span className="g-up inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--g-accent)] shadow-sm">
              🐶 Mobile pet spa · {city}
            </span>
            <h1 className={`${poppins.className} g-up mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl`} style={{ animationDelay: ".1s" }}>
              {data.headline}
            </h1>
            {data.subheadline && (
              <p className="g-up mt-6 max-w-lg text-lg leading-relaxed text-[var(--g-muted)]" style={{ animationDelay: ".2s" }}>
                {data.subheadline}
              </p>
            )}
            <div className="g-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: ".3s" }}>
              {tel && (
                <a href={`tel:${tel}`} className="inline-flex items-center gap-2 rounded-full bg-[var(--g-accent)] px-7 py-4 text-base font-semibold text-[var(--g-accent-contrast)] shadow-md transition hover:brightness-105">
                  ☎ {phoneDisplay}
                </a>
              )}
              <a href="#book" className="inline-flex items-center rounded-full border-2 border-[var(--g-text)]/10 bg-white px-7 py-4 text-base font-semibold transition hover:border-[var(--g-accent)] hover:text-[var(--g-accent)]">
                See services
              </a>
            </div>
            {/* trust chips */}
            <div className="g-up mt-10 flex flex-wrap gap-3" style={{ animationDelay: ".4s" }}>
              {[
                [`${data.rating ? data.rating.toFixed(1) : "5.0"}★`, "Google rating"],
                [`${data.ratingCount ?? 50}+`, "happy clients"],
                ["Comes to you", "no car ride"],
              ].map(([b, s]) => (
                <div key={s} className="rounded-2xl bg-white px-4 py-2.5 shadow-sm">
                  <span className={`${poppins.className} font-bold text-[var(--g-accent)]`}>{b}</span>{" "}
                  <span className="text-sm text-[var(--g-muted)]">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {/* hero image + floating badge */}
          <div className="g-up relative" style={{ animationDelay: ".2s" }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-8 border-white shadow-xl sm:aspect-square">
              <Image src={data.heroImage} alt={data.businessName} fill priority sizes="(max-width:1024px) 100vw, 45vw" className="object-cover" style={data.coverUrl ? { objectFit: "contain" } : { objectFit: "cover" }} />
            </div>
            <div className="g-float absolute -bottom-5 -left-4 rounded-2xl bg-white px-5 py-3 shadow-lg">
              <div className={`${poppins.className} text-2xl font-extrabold text-[var(--g-accent)]`}>{data.rating ? data.rating.toFixed(1) : "5.0"}★</div>
              <div className="text-xs text-[var(--g-muted)]">{data.ratingCount ?? 50} Google reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* marquee */}
      {data.services.length > 0 && (
        <div className="g-marquee bg-[var(--g-accent)] py-3">
          <div className="g-track">
            {[...data.services, ...data.services, ...data.services].map((s, i) => (
              <span key={i} className="mx-6 flex items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-white">
                <span>🐾</span> {s.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <section id="book" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className={`${poppins.className} text-4xl font-extrabold tracking-tight sm:text-5xl`}>Pampering, made easy</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--g-muted)]">Salon-quality care for your pup — right in your driveway.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((s, i) => (
            <div key={s.title} className="g-card rounded-3xl bg-white p-7 shadow-sm">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: PASTELS[i % PASTELS.length] }}>{EMOJI[i % EMOJI.length]}</span>
              <h3 className={`${poppins.className} text-xl font-bold`}>{s.title}</h3>
              <p className="mt-3 leading-relaxed text-[var(--g-muted)]">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className={`${poppins.className} text-3xl font-extrabold tracking-tight sm:text-4xl`}>Freshly groomed 🐩</h2>
          <span className="hidden text-sm font-semibold text-[var(--g-accent)] sm:block">This week · {city}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.gallery.map((g) => (
            <figure key={g.cap} className="g-figure group relative aspect-square overflow-hidden rounded-3xl border-4 border-white shadow-sm">
              <Image src={g.src} alt={g.cap} fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-[11px] font-semibold uppercase tracking-widest text-white">{g.cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Reviews */}
      {data.reviews.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className={`${poppins.className} mb-10 text-center text-4xl font-extrabold tracking-tight sm:text-5xl`}>Happy pups, happy parents</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {data.reviews.slice(0, 3).map((r, i) => (
              <figure key={r.name} className="rounded-3xl p-7 shadow-sm" style={{ background: PASTELS[i % PASTELS.length] }}>
                <div className="mb-3 text-lg tracking-widest text-[var(--g-accent)]">★★★★★</div>
                <blockquote className="text-[var(--g-text)]">&ldquo;{r.quote}&rdquo;</blockquote>
                <figcaption className={`${poppins.className} mt-5 text-sm font-bold`}>{r.name}<span className="font-normal text-[var(--g-muted)]"> · Google review</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Booking CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--g-accent)] px-8 py-14 text-center text-[var(--g-accent-contrast)] shadow-lg sm:px-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <h2 className={`${poppins.className} relative text-4xl font-extrabold tracking-tight sm:text-5xl`}>Book your pup&apos;s spa day 🛁</h2>
          <p className="relative mx-auto mt-4 max-w-md text-lg opacity-90">We come to you in {city}. Gentle, cage-free, and stress-free.</p>
          {tel && (
            <a href={`tel:${tel}`} className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-9 py-5 text-xl font-bold text-[var(--g-accent)] shadow-md transition hover:brightness-95">
              ☎ {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--g-muted)] sm:flex-row">
          <span className={`${poppins.className} font-bold text-[var(--g-text)]`}>🐾 {data.businessName}</span>
          <span>{data.city}</span>
          {tel && <a href={`tel:${tel}`} className="font-semibold text-[var(--g-accent)]">{phoneDisplay}</a>}
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
