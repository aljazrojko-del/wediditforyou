import ScrollReveal from "./ScrollReveal";

type Build = {
  business: string;
  city: string;
  niche: string;
  headline: string;
  url: string;
  builtIn: string;
  status: "shipped" | "open";
};

// Real builds from the auto-generation pipeline this week — one per focus niche.
// Owners haven't been pitched yet — they're sitting in Supabase as live URLs.
const BUILDS: Build[] = [
  {
    business: "Elite Mobile Tire & Brake",
    city: "Lubbock, TX",
    niche: "Mobile mechanic",
    headline: "Tires, Brakes, Mobile Service",
    url: "https://sites.wedidit4you.com/elite-mobile-tire-brake-lubbock-tx",
    builtIn: "Designed for a real Lubbock mechanic · pending owner review",
    status: "shipped",
  },
  {
    business: "Buddy's Mobile Spa",
    city: "Lubbock, TX",
    niche: "Mobile dog groomer",
    headline: "Your Dog Deserves Better Grooming",
    url: "https://sites.wedidit4you.com/buddy-s-mobile-spa-lubbock-tx",
    builtIn: "Designed for a real Lubbock groomer · pending owner review",
    status: "shipped",
  },
];

export default function CaseStudies() {
  return (
    <section className="border-t border-[#1F1814]/10 bg-[#FAF6F0]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <ScrollReveal className="mb-8 max-w-2xl sm:mb-10" variant="fade-up">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
            The first ten
          </p>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Live builds. Real businesses. Owners haven&apos;t seen them yet.
          </h2>
          <p className="mt-6 text-lg text-[#1F1814]/65">
            We&apos;re locking in 10 founding clients at $450. The first two
            sites are below — owners get a call this week. After that, the
            price moves to $700 permanently.
          </p>
        </ScrollReveal>

        <ScrollReveal
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variant="stagger"
          staggerSelector=".case"
        >
          {BUILDS.map((b) => (
            <article
              key={b.business}
              className="case group flex flex-col overflow-hidden rounded-3xl border border-[#1F1814]/10 bg-white transition hover:-translate-y-1 hover:border-[#C2410C]/40 hover:shadow-lg"
            >
              <div className="border-b border-[#1F1814]/10 bg-[#F0E9DC] px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1F1814]/55">
                    {b.niche} · {b.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1F1814] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#E89A6B]">
                    <span className="h-1 w-1 rounded-full bg-[#E89A6B]" />
                    Shipped
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="text-xs font-mono text-[#1F1814]/45">
                  {b.business}
                </div>
                <blockquote
                  className="mt-3 text-xl leading-tight tracking-tight text-[#1F1814]"
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 500,
                  }}
                >
                  &ldquo;{b.headline}&rdquo;
                </blockquote>
                <p className="mt-4 text-xs text-[#1F1814]/55">
                  {b.builtIn}
                </p>

                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-6 text-sm font-semibold text-[#C2410C] hover:underline"
                >
                  View the live site →
                </a>
              </div>
            </article>
          ))}

          {/* Empty founding-client slot — explicit CTA to claim spot #3 */}
          <article className="case relative flex flex-col overflow-hidden rounded-3xl border-2 border-dashed border-[#C2410C]/40 bg-[#C2410C]/5">
            <div className="border-b border-[#C2410C]/20 bg-[#C2410C]/10 px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">
                  Spot 3 of 10
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C2410C]/30 bg-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-[#C2410C]" />
                  Open
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="text-xs font-mono text-[#C2410C]/70">
                Your business · Your city
              </div>
              <blockquote
                className="mt-3 text-xl leading-tight tracking-tight text-[#C2410C]"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                &ldquo;Your custom headline here.&rdquo;
              </blockquote>
              <p className="mt-4 text-xs text-[#1F1814]/55">
                Be the first founding client. Free site if it&apos;s
                not&nbsp;live within 24 hours.
              </p>

              <a
                href="#contact"
                className="mt-auto pt-6 text-sm font-bold text-[#C2410C] hover:underline"
              >
                Claim this spot →
              </a>
            </div>
          </article>
        </ScrollReveal>

        <p className="mt-8 max-w-2xl text-sm text-[#1F1814]/55">
          The first two sites are live and waiting for owner approval. When the
          first three founding clients say yes, this section turns into real
          quotes with photos. Be one of them.
        </p>
      </div>
    </section>
  );
}
