import Image from "next/image";
import { Fraunces, Inter } from "next/font/google";
import type { SiteData } from "./types";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-groomer",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-groomer",
});

export default function TemplateGroomer({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Book now";
  const shortName = data.businessName.split(/\s+/)[0] ?? "Groom";

  // Brand: warm cream + deep teal + coral accent. Premium boutique pet spa.
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#FBF6EF] text-[#1A2E33]`}
      style={{ fontFamily: "var(--font-body-groomer)" }}
    >
      {/* Top ribbon */}
      <div className="bg-[#1A2E33] text-[#FBF6EF]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 text-xs font-medium tracking-wide">
          <span>Mobile grooming · van comes to your driveway</span>
          {tel && (
            <a href={`tel:${tel}`} className="font-semibold text-[#F8B5A0] hover:underline">
              {phoneDisplay}
            </a>
          )}
        </div>
      </div>

      {/* Nav */}
      <header className="border-b border-[#1A2E33]/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div
            className="text-2xl font-medium tracking-tight text-[#1A2E33]"
            style={{ fontFamily: "var(--font-display-groomer)" }}
          >
            {shortName}
            <span className="text-[#E97862]">.</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[#1A2E33]/70 sm:flex">
            <a href="#services" className="hover:text-[#1A2E33]">Services</a>
            <a href="#gallery" className="hover:text-[#1A2E33]">Recent grooms</a>
            <a href="#book" className="hover:text-[#1A2E33]">Visit</a>
          </nav>
          {tel && (
            <a
              href={`tel:${tel}`}
              className="rounded-full bg-[#1A2E33] px-5 py-2.5 text-sm font-semibold text-[#FBF6EF] transition hover:bg-[#2a4047]"
            >
              Book a groom
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-[#F8B5A0] opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-20 h-[320px] w-[320px] rounded-full bg-[#1A2E33] opacity-10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[#E97862]">
                — {data.city} mobile grooming —
              </p>
              <h1
                className="text-5xl leading-[1.02] tracking-tight sm:text-7xl"
                style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
              >
                {data.headline}
              </h1>
              {data.subheadline && (
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#1A2E33]/75 sm:text-xl">
                  {data.subheadline}
                </p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {tel && (
                  <a
                    href={`tel:${tel}`}
                    className="inline-flex items-center justify-center rounded-full bg-[#1A2E33] px-7 py-4 text-base font-semibold text-[#FBF6EF] transition hover:bg-[#2a4047]"
                  >
                    Book a groom →
                  </a>
                )}
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-full border border-[#1A2E33]/20 bg-white px-7 py-4 text-base font-semibold text-[#1A2E33] transition hover:border-[#1A2E33]/50"
                >
                  See services
                </a>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[#1A2E33]/10 bg-[#1A2E33]/5">
                <Image
                  src={data.heroImage}
                  alt={`${data.businessName} mobile dog grooming`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#FBF6EF]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A2E33] backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E97862]" />
                  Booking this week
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-[#1A2E33]/10 pt-8 sm:grid-cols-4">
            {[
              [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", "Google reviews"],
              [data.ratingCount ? `${data.ratingCount}+` : "100+", "Dogs groomed"],
              ["1:1", "One dog at a time"],
              ["No cages", "Ever"],
            ].map(([big, small]) => (
              <div key={small}>
                <div
                  className="text-3xl font-medium text-[#1A2E33]"
                  style={{ fontFamily: "var(--font-display-groomer)" }}
                >
                  {big}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#1A2E33]/55">
                  {small}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      {data.services.length > 0 && (
        <section id="services" className="border-t border-[#1A2E33]/10 bg-[#F3EBDD]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#E97862]">
                What we do
              </p>
              <h2
                className="text-4xl leading-tight tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
              >
                Spa-level grooming. At your door.
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {data.services.map((s, i) => (
                <article
                  key={s.title}
                  className="rounded-3xl border border-[#1A2E33]/10 bg-white p-7 transition hover:-translate-y-1 hover:border-[#E97862]/60 hover:shadow-lg"
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-mono text-sm text-[#E97862]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      0{i + 1}
                    </span>
                    <h3
                      className="text-2xl tracking-tight text-[#1A2E33]"
                      style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
                    >
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#1A2E33]/70">
                    {s.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      <section id="gallery" className="border-t border-[#1A2E33]/10 bg-[#FBF6EF]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2
              className="text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
            >
              Recent grooms.
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-[0.25em] text-[#E97862] sm:block">
              This week · {data.city}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.gallery.map((g) => (
              <figure
                key={g.cap}
                className="group relative aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={g.src}
                  alt={g.cap}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A2E33]/90 to-transparent p-3 text-[11px] font-medium tracking-wide text-[#FBF6EF]">
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      {data.about && (
        <section className="border-t border-[#1A2E33]/10 bg-[#1A2E33] text-[#FBF6EF]">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[#F8B5A0]">
              About {shortName}
            </p>
            <p
              className="text-2xl leading-relaxed sm:text-3xl"
              style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 400, fontStyle: "italic" }}
            >
              {data.about}
            </p>
          </div>
        </section>
      )}

      {/* Reviews */}
      {data.reviews.length > 0 && (
        <section className="border-t border-[#1A2E33]/10 bg-[#FBF6EF]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <h2
              className="mb-12 text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
            >
              {data.city} dog parents love us.
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {data.reviews.map((r) => (
                <figure
                  key={r.name}
                  className="rounded-3xl border border-[#1A2E33]/10 bg-white p-7"
                >
                  <div className="mb-3 text-[#E97862]">★★★★★</div>
                  <blockquote className="text-[15px] leading-relaxed text-[#1A2E33]/85">
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 font-mono text-xs uppercase tracking-[0.25em] text-[#1A2E33]/55">
                    {r.name} · {data.city}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="book" className="border-t border-[#1A2E33]/10 bg-[#F8B5A0] text-[#1A2E33]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2
              className="text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display-groomer)", fontWeight: 500 }}
            >
              Book a groom for next week.
            </h2>
            <p className="mt-3 text-lg font-medium">
              We bring the van. You skip the salon. Your dog comes home clean and tired.
            </p>
          </div>
          {tel && (
            <a
              href={`tel:${tel}`}
              className="inline-flex items-center justify-center rounded-full bg-[#1A2E33] px-8 py-5 text-lg font-semibold text-[#FBF6EF] transition hover:bg-[#2a4047]"
            >
              {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A2E33] text-[#FBF6EF]/80">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div
              className="mb-3 text-xl font-medium"
              style={{ fontFamily: "var(--font-display-groomer)" }}
            >
              {data.businessName}
              <span className="text-[#E97862]">.</span>
            </div>
            <p className="text-sm text-[#FBF6EF]/55">
              Mobile dog grooming for {data.city}. One dog at a time. No cages, no rush.
            </p>
          </div>
          {data.address && (
            <div>
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#F8B5A0]">
                Service area
              </div>
              <p className="text-sm">{data.address}</p>
            </div>
          )}
          {tel && (
            <div>
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#F8B5A0]">
                Book
              </div>
              <a href={`tel:${tel}`} className="text-sm font-semibold text-[#F8B5A0]">
                {phoneDisplay}
              </a>
            </div>
          )}
        </div>
        <div className="border-t border-[#FBF6EF]/10">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-[#FBF6EF]/40">
            © {new Date().getFullYear()} {data.businessName}
          </div>
        </div>
      </footer>
    </div>
  );
}
