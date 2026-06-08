import ScrollReveal from "./ScrollReveal";

export default function Founder() {
  return (
    <section className="border-t border-[#1F1814]/10 bg-[#FAF6F0]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <ScrollReveal
          className="mx-auto max-w-3xl"
          variant="fade-up"
        >
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C] sm:mb-8">
            From the founder
          </p>

          <blockquote
            className="text-3xl leading-tight tracking-tight text-[#1F1814] sm:text-5xl"
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            &ldquo;Most agencies want $3,000 upfront. Most local owners
            can&apos;t afford that — and shouldn&apos;t have to.&rdquo;
          </blockquote>

          <div className="mt-6 grid gap-4 max-w-xl text-[17px] leading-relaxed text-[#1F1814]/80 sm:mt-8">
            <p>
              I started this after watching small businesses lose customers
              every week because they don&apos;t have a website and can&apos;t
              afford the agencies that build them.
            </p>
            <p>
              So we flipped the script. We build first. You pay only if you
              actually want the result.
            </p>
            <p>
              $450 is launch pricing — we&apos;re building our portfolio.
              After the first ten paying clients, the price moves to $700.
              Until then, you get the same site for less than what most
              charge for a logo.
            </p>
            <p className="font-semibold text-[#1F1814]">
              If your site doesn&apos;t make you proud, you owe nothing. Walk
              away with the draft.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            {/*
              TODO Alex: drop a real headshot at public/alex.jpg, then replace this
              initials avatar with: <Image src="/alex.jpg" alt="Alex Rojko" fill className="object-cover" />
              Real photo is the #1 missing trust signal per buyer audit.
            */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1F1814]/15 bg-gradient-to-br from-[#C2410C] to-[#9A3412] font-mono text-base font-bold tracking-tight text-white shadow-sm">
              AR
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1F1814]">
                Alex Rojko
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#1F1814]/55">
                Founder · I answer every email myself
              </div>
              <a
                href="mailto:info@wedidit4you.com"
                className="mt-1 inline-block font-mono text-xs text-[#C2410C] underline-offset-2 hover:underline"
              >
                info@wedidit4you.com
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
