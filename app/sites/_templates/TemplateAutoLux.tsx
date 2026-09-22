import Image from "next/image";
import { Sora, Inter } from "next/font/google";
import type { CSSProperties } from "react";
import type { SiteData } from "./types";

// Premium display + clean body. A distinct type pairing from TemplateAuto so
// the two options read as genuinely different designs, not a recolor.
const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

// Luxe default palette: deep navy + warm gold. Any lead `theme` overrides win.
const DEFAULTS = {
  bg: "#0A0E1A",
  bgSurface: "#111726",
  accent: "#E7B44C",
  accentSoft: "#F2D48A",
  accentContrast: "#0A0E1A",
  text: "#F6F4EF",
  textMuted: "#9AA6BC",
} as const;

type ThemeVars = {
  "--l-bg": string; "--l-surface": string; "--l-accent": string;
  "--l-accent-soft": string; "--l-accent-contrast": string; "--l-text": string; "--l-muted": string;
};

function buildTheme(data: SiteData): ThemeVars {
  const t = data.theme ?? {};
  return {
    "--l-bg": t.bg ?? DEFAULTS.bg,
    "--l-surface": DEFAULTS.bgSurface,
    "--l-accent": t.accent ?? DEFAULTS.accent,
    "--l-accent-soft": DEFAULTS.accentSoft,
    "--l-accent-contrast": t.accentContrast ?? DEFAULTS.accentContrast,
    "--l-text": t.text ?? DEFAULTS.text,
    "--l-muted": t.textMuted ?? DEFAULTS.textMuted,
  };
}

// Spanish static labels — this template is purpose-built for Spanish-speaking leads.
const T = {
  onCall: "Disponible ahora",
  eta: "llega en 30 min a",
  call: "Llamar ahora",
  quote: "Pedir cotización",
  services: "Nuestros servicios",
  work: "Trabajos recientes",
  thisWeek: "Esta semana",
  reviews: "Lo que dicen los clientes",
  verified: "reseñas verificadas de Google",
  ctaTitle: "¿Tu carro te dejó tirado?",
  ctaSub: "Dinos dónde estás. Llegamos en 30 minutos.",
  area: "Zona de servicio",
  callLabel: "Llamar",
  reviewTag: "Reseña de Google",
  statReviews: "Reseñas Google",
  statJobs: "Trabajos hechos",
  statResp: "Respuesta prom.",
  statArea: "Zona",
  min30: "30 min",
  mobile: "Servicio a domicilio · Precios claros",
};

export default function TemplateAutoLux({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? T.call;
  const city = data.city.split(",")[0];
  const themeStyle = buildTheme(data) as unknown as CSSProperties;

  return (
    <div style={themeStyle} className={`${inter.className} min-h-screen bg-[var(--l-bg)] text-[var(--l-text)] antialiased`}>
      {/* All animations are pure CSS (no JS) so this stays a server component. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes luxUp { from { opacity:0; transform: translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes luxFade { from { opacity:0; } to { opacity:1; } }
        @keyframes luxSheen { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes luxFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes luxScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .lux-up,.lux-fade { animation: none !important; } .lux-track { animation: none !important; } }
        .lux-up { opacity:0; animation: luxUp .9s cubic-bezier(.16,1,.3,1) forwards; }
        .lux-fade { opacity:0; animation: luxFade 1.2s ease forwards; }
        .lux-marquee { overflow:hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .lux-track { display:flex; width:max-content; animation: luxScroll 26s linear infinite; }
        .lux-shimmer { background: linear-gradient(100deg, transparent 30%, var(--l-accent-soft) 50%, transparent 70%); background-size: 200% 100%; animation: luxSheen 6s linear infinite; -webkit-background-clip:text; background-clip:text; color:transparent; }
        .lux-card { transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s, border-color .4s; }
        .lux-card:hover { transform: translateY(-6px); border-color: var(--l-accent); box-shadow: 0 24px 60px -24px rgba(231,180,76,.35); }
        .lux-underline { position:relative; }
        .lux-underline::after { content:""; position:absolute; left:0; bottom:-6px; height:2px; width:0; background:var(--l-accent); transition:width .5s cubic-bezier(.16,1,.3,1); }
        .lux-card:hover .lux-underline::after { width:100%; }
        .lux-img { transition: transform .7s cubic-bezier(.16,1,.3,1); }
        .lux-figure:hover .lux-img { transform: scale(1.08); }
      `}} />

      {/* Top ribbon */}
      <div className="border-b border-white/5 bg-[var(--l-surface)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-2.5 text-[12px] font-medium tracking-wide text-[var(--l-muted)]">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--l-accent)] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--l-accent)]" /></span>
            {T.onCall} · {T.eta} {city}
          </span>
          {tel && <a href={`tel:${tel}`} className="font-semibold text-[var(--l-text)] hover:text-[var(--l-accent)]">{phoneDisplay}</a>}
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            <Image src={data.logoUrl} alt={data.businessName} width={48} height={48} className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--l-accent)]/40 text-lg font-bold text-[var(--l-accent)]" style={{ fontFamily: sora.style.fontFamily }}>
              {data.businessName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className={`${sora.className} text-lg font-700 font-semibold tracking-tight`}>{data.businessName}</span>
        </div>
        {tel && (
          <a href={`tel:${tel}`} className="rounded-full bg-[var(--l-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--l-accent-contrast)] transition hover:bg-[var(--l-accent-soft)]">
            {T.call}
          </a>
        )}
      </header>

      {/* Cinematic hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={data.heroImage} alt={data.businessName} fill priority sizes="100vw" className="object-cover opacity-40" style={data.coverUrl ? { objectFit: "contain" } : { objectFit: "cover" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 20% 10%, transparent, var(--l-bg) 70%), linear-gradient(180deg, transparent, var(--l-bg))" }} />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
          <div className="lux-up max-w-3xl" style={{ animationDelay: ".05s" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--l-accent)]/30 bg-[var(--l-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--l-accent)]">
              {T.mobile}
            </span>
          </div>
          <h1 className={`${sora.className} lux-up mt-7 max-w-4xl text-5xl font-800 font-extrabold leading-[1.02] tracking-tight sm:text-7xl`} style={{ animationDelay: ".15s" }}>
            {data.headline}
          </h1>
          {data.subheadline && (
            <p className="lux-up mt-7 max-w-xl text-lg leading-relaxed text-[var(--l-muted)]" style={{ animationDelay: ".28s" }}>
              {data.subheadline}
            </p>
          )}
          <div className="lux-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: ".4s" }}>
            {tel && (
              <a href={`tel:${tel}`} className="group inline-flex items-center gap-2 rounded-full bg-[var(--l-accent)] px-8 py-4 text-base font-semibold text-[var(--l-accent-contrast)] transition hover:bg-[var(--l-accent-soft)]">
                <span className="text-lg">☎</span> {phoneDisplay}
              </a>
            )}
            <a href="#contacto" className="inline-flex items-center rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-[var(--l-text)] transition hover:border-[var(--l-accent)] hover:text-[var(--l-accent)]">
              {T.quote}
            </a>
          </div>

          {/* Glass stat cards */}
          <div className="lux-up mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ animationDelay: ".52s" }}>
            {[
              [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", T.statReviews],
              [data.ratingCount ? `${data.ratingCount}+` : "100+", T.statJobs],
              [T.min30, T.statResp],
              [city, T.statArea],
            ].map(([big, small]) => (
              <div key={small} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                <div className={`${sora.className} text-3xl font-extrabold text-[var(--l-accent)]`}>{big}</div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-[var(--l-muted)]">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated marquee of services */}
      {data.services.length > 0 && (
        <div className="lux-marquee border-y border-white/5 bg-[var(--l-surface)] py-4">
          <div className="lux-track">
            {[...data.services, ...data.services, ...data.services].map((s, i) => (
              <span key={i} className="mx-6 flex items-center gap-3 whitespace-nowrap text-sm font-medium uppercase tracking-widest text-[var(--l-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--l-accent)]" /> {s.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Servicios */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mb-14 flex items-end justify-between gap-4">
          <h2 className={`${sora.className} text-4xl font-extrabold tracking-tight sm:text-5xl`}>{T.services}</h2>
          <span className="hidden text-sm text-[var(--l-muted)] sm:block">{city}</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((s) => (
            <div key={s.title} className="lux-card rounded-2xl border border-white/10 bg-[var(--l-surface)] p-7">
              <h3 className={`${sora.className} lux-underline inline-block text-xl font-bold`}>{s.title}</h3>
              <p className="mt-4 leading-relaxed text-[var(--l-muted)]">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Galería */}
      <section className="border-t border-white/5 bg-[var(--l-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-12 flex items-end justify-between">
            <h2 className={`${sora.className} text-4xl font-extrabold tracking-tight sm:text-5xl`}>{T.work}</h2>
            <span className="hidden text-sm text-[var(--l-accent)] sm:block">{T.thisWeek} · {city}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.gallery.map((g) => (
              <figure key={g.cap} className="lux-figure group relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                <Image src={g.src} alt={g.cap} fill sizes="(max-width:640px) 100vw, 25vw" className="lux-img object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-[11px] font-semibold uppercase tracking-widest text-white">{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Opiniones */}
      {data.reviews.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-12 flex items-end justify-between gap-4">
            <h2 className={`${sora.className} text-4xl font-extrabold tracking-tight sm:text-5xl`}>{T.reviews}</h2>
            <span className="hidden text-sm text-[var(--l-muted)] sm:block">{data.reviews.length} {T.verified}</span>
          </div>
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
            {data.reviews.map((r) => (
              <figure key={r.name} className="flex min-h-[240px] w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-[var(--l-surface)] p-8 sm:w-[440px]">
                <div className="mb-4 text-lg tracking-widest text-[var(--l-accent)]">★★★★★</div>
                <blockquote className="flex-1 text-lg leading-relaxed">&ldquo;{r.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-widest text-[var(--l-muted)]">{r.name} · {T.reviewTag}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="contacto" className="relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0" style={{ background: "radial-gradient(80% 120% at 80% 0%, var(--l-accent), transparent 55%)", opacity: .16 }} />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-6 py-20 sm:flex-row sm:items-center">
          <div>
            <h2 className={`${sora.className} text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl`}>{T.ctaTitle}</h2>
            <p className="mt-4 text-lg text-[var(--l-muted)]">{T.ctaSub}</p>
          </div>
          {tel && (
            <a href={`tel:${tel}`} className="inline-flex items-center gap-2 rounded-full bg-[var(--l-accent)] px-9 py-5 text-xl font-bold text-[var(--l-accent-contrast)] transition hover:bg-[var(--l-accent-soft)]">
              ☎ {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[var(--l-surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div className={`${sora.className} mb-3 text-lg font-bold`}>{data.businessName}</div>
            <p className="text-sm text-[var(--l-muted)]">{T.mobile}.</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--l-muted)]">{T.area}</div>
            <p className="text-sm">{data.city}</p>
          </div>
          {tel && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--l-muted)]">{T.callLabel}</div>
              <a href={`tel:${tel}`} className="text-sm font-semibold text-[var(--l-accent)]">{phoneDisplay}</a>
            </div>
          )}
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[var(--l-muted)]">© {new Date().getFullYear()} {data.businessName}</div>
        </div>
      </footer>
    </div>
  );
}
