import Image from "next/image";
import { Lora, Inter } from "next/font/google";
import type { SiteData } from "./types";

const display = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-tutor",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-tutor",
});

export default function TemplateTutor({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Book a session";
  const shortName = data.businessName.split(/\s+/)[0] ?? "Tutor";

  // Brand: ivory + deep navy + gold accent. Premium academic / private-tutor feel.
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#FAF7F0] text-[#0E2238]`}
      style={{ fontFamily: "var(--font-body-tutor)" }}
    >
      {/* Top bar */}
      <div className="bg-[#0E2238] text-[#FAF7F0]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 text-xs font-medium tracking-wide">
          <span>One-on-one tutoring · {data.city} & online</span>
          {tel && (
            <a href={`tel:${tel}`} className="font-semibold text-[#D4AF6F] hover:underline">
              {phoneDisplay}
            </a>
          )}
        </div>
      </div>

      {/* Nav */}
      <header className="border-b border-[#0E2238]/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl tracking-tight text-[#0E2238]"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
            >
              {shortName}
            </span>
            <span className="text-sm text-[#D4AF6F]" style={{ fontFamily: "var(--font-display-tutor)", fontStyle: "italic" }}>
              tutoring
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[#0E2238]/70 sm:flex">
            <a href="#subjects" className="hover:text-[#0E2238]">Subjects</a>
            <a href="#approach" className="hover:text-[#0E2238]">Approach</a>
            <a href="#parents" className="hover:text-[#0E2238]">Parent reviews</a>
          </nav>
          <a
            href="#book"
            className="rounded-md bg-[#0E2238] px-5 py-2.5 text-sm font-semibold text-[#FAF7F0] transition hover:bg-[#1a3252]"
          >
            Book a session
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#D4AF6F] opacity-25 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[#D4AF6F]">
                — Trusted by {data.city} families —
              </p>
              <h1
                className="text-5xl leading-[1.05] tracking-tight sm:text-7xl"
                style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
              >
                {data.headline}
              </h1>
              {data.subheadline && (
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#0E2238]/75 sm:text-xl">
                  {data.subheadline}
                </p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="#book"
                  className="inline-flex items-center justify-center rounded-md bg-[#0E2238] px-7 py-4 text-base font-semibold text-[#FAF7F0] transition hover:bg-[#1a3252]"
                >
                  Book a free trial →
                </a>
                <a
                  href="#approach"
                  className="inline-flex items-center justify-center rounded-md border border-[#0E2238]/20 bg-white px-7 py-4 text-base font-semibold text-[#0E2238] transition hover:border-[#0E2238]/50"
                >
                  How we teach
                </a>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-[#0E2238]/15 shadow-[0_30px_60px_-25px_rgba(14,34,56,0.4)]">
                <Image
                  src={data.heroImage}
                  alt={`${data.businessName} one-on-one tutoring`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute left-5 bottom-5 rounded bg-[#0E2238]/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF6F] backdrop-blur">
                  Spots open · K-12 & college
                </div>
              </div>
            </div>
          </div>

          {/* Stats / trust */}
          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-[#0E2238]/10 pt-8 sm:grid-cols-4">
            {[
              [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", "Parent rating"],
              [data.ratingCount ? `${data.ratingCount}+` : "100+", "Sessions taught"],
              ["1:1", "Always one-on-one"],
              ["K-12", "Through college"],
            ].map(([big, small]) => (
              <div key={small}>
                <div
                  className="text-3xl text-[#0E2238]"
                  style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
                >
                  {big}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#0E2238]/55">
                  {small}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects (services) */}
      {data.services.length > 0 && (
        <section id="subjects" className="border-t border-[#0E2238]/10 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#D4AF6F]">
                Subjects we teach
              </p>
              <h2
                className="text-4xl leading-tight tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
              >
                Specialists by subject. Not generalists.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {data.services.map((s, i) => (
                <article
                  key={s.title}
                  className="border-l-2 border-[#D4AF6F] bg-[#FAF7F0] p-7 transition hover:border-[#0E2238] hover:bg-[#F3EDDC]"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tracking-widest text-[#D4AF6F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="text-2xl tracking-tight text-[#0E2238]"
                      style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
                    >
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#0E2238]/75">
                    {s.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Approach (about) */}
      {data.about && (
        <section id="approach" className="border-t border-[#0E2238]/10 bg-[#0E2238] text-[#FAF7F0]">
          <div className="mx-auto w-full max-w-3xl px-6 py-20">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[#D4AF6F]">
              Our approach
            </p>
            <blockquote
              className="text-2xl leading-relaxed sm:text-3xl"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 400, fontStyle: "italic" }}
            >
              &ldquo;{data.about}&rdquo;
            </blockquote>
          </div>
        </section>
      )}

      {/* Sessions gallery */}
      <section className="border-t border-[#0E2238]/10 bg-[#FAF7F0]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2
              className="text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
            >
              Sessions, in progress.
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF6F] sm:block">
              {data.city} & online
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.gallery.map((g) => (
              <figure
                key={g.cap}
                className="group relative aspect-square overflow-hidden"
              >
                <Image
                  src={g.src}
                  alt={g.cap}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E2238]/90 to-transparent p-3 text-[11px] font-medium tracking-wide text-[#FAF7F0]">
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Parent reviews */}
      {data.reviews.length > 0 && (
        <section id="parents" className="border-t border-[#0E2238]/10 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#D4AF6F]">
              From parents
            </p>
            <h2
              className="mb-12 text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
            >
              Results, in their words.
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {data.reviews.map((r) => (
                <figure key={r.name} className="border-t-2 border-[#D4AF6F] bg-[#FAF7F0] p-7">
                  <div className="mb-3 text-[#D4AF6F]">★★★★★</div>
                  <blockquote
                    className="text-[17px] leading-relaxed text-[#0E2238]"
                    style={{ fontFamily: "var(--font-display-tutor)", fontStyle: "italic" }}
                  >
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 font-mono text-xs uppercase tracking-[0.25em] text-[#0E2238]/55">
                    {r.name} · {data.city} parent
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="book" className="border-t border-[#0E2238]/10 bg-[#D4AF6F] text-[#0E2238]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2
              className="text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
            >
              First session is free.
            </h2>
            <p className="mt-3 text-lg font-medium">
              30 minutes. We meet your student, talk through goals, decide if we&apos;re a fit.
            </p>
          </div>
          {tel && (
            <a
              href={`tel:${tel}`}
              className="inline-flex items-center justify-center rounded-md bg-[#0E2238] px-8 py-5 text-lg font-semibold text-[#FAF7F0] transition hover:bg-[#1a3252]"
            >
              {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0E2238] text-[#FAF7F0]/75">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div
              className="mb-3 text-xl"
              style={{ fontFamily: "var(--font-display-tutor)", fontWeight: 600 }}
            >
              {data.businessName}
            </div>
            <p className="text-sm text-[#FAF7F0]/55">
              One-on-one tutoring across {data.city}. K-12 through college prep. Real teachers, measurable progress.
            </p>
          </div>
          {data.address && (
            <div>
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF6F]">
                Service area
              </div>
              <p className="text-sm">{data.address}</p>
            </div>
          )}
          {tel && (
            <div>
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF6F]">
                Book a session
              </div>
              <a href={`tel:${tel}`} className="text-sm font-semibold text-[#D4AF6F]">
                {phoneDisplay}
              </a>
            </div>
          )}
        </div>
        <div className="border-t border-[#FAF7F0]/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[#FAF7F0]/40">
            © {new Date().getFullYear()} {data.businessName}
          </div>
        </div>
      </footer>
    </div>
  );
}
