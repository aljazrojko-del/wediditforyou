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
              $297 is pre-revenue pricing — we&apos;re building our portfolio.
              After the first ten paying clients, the price moves to $497.
              Until then, you get the same site for less than what most
              charge for a logo.
            </p>
            <p className="font-semibold text-[#1F1814]">
              If your site doesn&apos;t make you proud, you owe nothing. Walk
              away with the draft.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C2410C] text-lg font-semibold text-white">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1F1814]">
                Alex
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#1F1814]/55">
                Founder · wediditforyou
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
