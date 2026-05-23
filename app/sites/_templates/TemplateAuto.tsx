import Image from "next/image";
import { Inter_Tight } from "next/font/google";
import type { SiteData } from "./types";

const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function TemplateAuto({ data }: { data: SiteData }) {
  const tel = data.phone ? data.phone.replace(/[^0-9+]/g, "") : "";
  const phoneDisplay = data.phone ?? "Call us";
  const words = data.businessName.split(/\s+/);
  const shortName = words[0]?.toUpperCase() ?? "AUTO";
  const restOfName = words.slice(1).join(" ");

  return (
    <div className={`${inter.className} min-h-screen bg-[#0F1216] text-white`}>
      <div className="bg-[#FF6B00] text-[#0F1216]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider">
          <span>⚙ On-call now · 30 min ETA in {data.city}</span>
          {tel && <a href={`tel:${tel}`} className="hover:underline">{phoneDisplay}</a>}
        </div>
      </div>

      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
            <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[#0F1216]">{shortName}</span>
            {restOfName && <span className="hidden sm:inline">{restOfName}</span>}
          </div>
          {tel && (
            <a href={`tel:${tel}`} className="rounded-md bg-[#FF6B00] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[#0F1216] hover:bg-orange-400">
              Call now
            </a>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#FF6B00]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B00]" />
              Mobile · Upfront pricing
            </div>
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
              {data.headline}
            </h1>
            {data.subheadline && (
              <p className="mt-8 max-w-xl text-lg text-zinc-300">
                {data.subheadline}
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-4">
              {tel && (
                <a href={`tel:${tel}`} className="inline-flex items-center justify-center rounded-md bg-[#FF6B00] px-7 py-4 text-lg font-extrabold uppercase tracking-wider text-[#0F1216] hover:bg-orange-400">
                  ☎ {phoneDisplay}
                </a>
              )}
              <a href="#book" className="inline-flex items-center justify-center rounded-md border-2 border-white/20 px-7 py-4 text-lg font-bold uppercase tracking-wider text-white hover:border-white">
                Request a quote
              </a>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-[#FF6B00]/30">
              <Image src={data.heroImage} alt={`${data.businessName} mobile mechanic`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1216] to-transparent p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">
                  On-site in 30 min · {data.city}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
          {[
            [data.rating ? `${data.rating.toFixed(1)}★` : "5.0★", "Google reviews"],
            [data.ratingCount ? `${data.ratingCount}+` : "100+", "Jobs completed"],
            ["30 min", "Avg response"],
            [data.city.split(",")[0], "Service area"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-3xl font-extrabold text-[#FF6B00]">{big}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-400">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#161A20]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">What we fix.</h2>
          <div className="grid gap-1 border border-white/10 sm:grid-cols-2">
            {data.services.map((s) => (
              <div key={s.title} className="bg-[#0F1216] p-8">
                <div className="mb-3 inline-block bg-[#FF6B00] px-2 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#0F1216]">{s.title}</div>
                <p className="text-zinc-300">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#161A20]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Recent jobs.</h2>
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[#FF6B00] sm:block">This week · {data.city}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.gallery.map((g) => (
              <figure key={g.cap} className="group relative aspect-square overflow-hidden border border-white/10">
                <Image src={g.src} alt={g.cap} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-[11px] font-bold uppercase tracking-widest text-white">{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">{data.city} trusts us.</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {data.reviews.map((r) => (
              <figure key={r.name} className="border border-white/10 bg-[#161A20] p-7">
                <div className="mb-3 text-[#FF6B00]">★★★★★</div>
                <blockquote className="text-zinc-200">&ldquo;{r.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-widest text-zinc-400">{r.name} · {data.city}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="book" className="border-t border-white/10 bg-[#FF6B00] text-[#0F1216]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">Stuck somewhere?</h2>
            <p className="mt-3 text-lg font-medium">Tell us where you are. We&apos;ll be there in 30 min.</p>
          </div>
          {tel && (
            <a href={`tel:${tel}`} className="inline-flex items-center justify-center rounded-md bg-[#0F1216] px-8 py-5 text-xl font-extrabold uppercase tracking-wider text-[#FF6B00] hover:bg-[#1a1f26]">
              ☎ {phoneDisplay}
            </a>
          )}
        </div>
      </section>

      <footer className="bg-black">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div className="mb-3 text-lg font-extrabold uppercase tracking-tight">
              <span className="rounded bg-[#FF6B00] px-2 py-0.5 text-[#0F1216]">{shortName}</span>
            </div>
            <p className="text-sm text-zinc-500">Mobile. Upfront pricing, every job.</p>
          </div>
          {data.address && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Service area</div>
              <p className="text-sm text-zinc-300">{data.city}</p>
            </div>
          )}
          {tel && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Call</div>
              <a href={`tel:${tel}`} className="text-sm font-bold text-[#FF6B00]">{phoneDisplay}</a>
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
