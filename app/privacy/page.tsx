import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — wediditforyou",
  description:
    "How wediditforyou collects, uses, and protects your information, including SMS opt-in data and carrier compliance.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24 text-stone-800 dark:text-stone-100">
      <Link
        href="/"
        className="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        ← Back to wediditforyou
      </Link>

      <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
        Last updated: May 21, 2026
      </p>

      <div className="prose prose-stone dark:prose-invert max-w-none mt-10 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">1. Who we are</h2>
          <p>
            wediditforyou (&quot;we&quot;, &quot;us&quot;) builds and delivers
            websites for local US service businesses — mobile mechanics,
            dog groomers, tutors, and similar appointment-based operators.
            For questions about this policy contact{" "}
            <a
              href="mailto:aljaz.rojko@gmail.com"
              className="underline"
            >
              aljaz.rojko@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information we collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Contact information you submit:</strong> name, email
              address, phone number, business name, and any notes you include
              when you fill in a form on this site or reply to our outreach.
            </li>
            <li>
              <strong>Business information from public listings:</strong>{" "}
              business name, public phone number, public address, public
              ratings and review counts collected from Google Maps, Yelp, and
              similar directories. This is used only to identify whether your
              business may benefit from our service.
            </li>
            <li>
              <strong>SMS opt-in and consent records:</strong> when you
              receive SMS from us and reply to opt in or out, we store that
              record (phone number, timestamp, the message you sent).
            </li>
            <li>
              <strong>Server logs:</strong> standard request metadata
              (timestamp, IP, user agent) for security and debugging,
              retained no longer than 30 days.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. How we use it</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To respond to your inquiry or build the website you requested.</li>
            <li>To send you the preview URL of the site we built for you.</li>
            <li>To send you appointment reminders or follow-ups you opted in to.</li>
            <li>To improve our service and identify which outreach approaches work.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Who we share it with</h2>
          <p>We use a small set of vendors strictly to deliver the service:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Supabase</strong> — encrypted database where we store
              contact records.
            </li>
            <li>
              <strong>Vercel</strong> — hosts this website and our internal
              dashboard.
            </li>
            <li>
              <strong>OpenPhone</strong> — sends and receives SMS on our behalf.
            </li>
            <li>
              <strong>Smartlead, GoHighLevel</strong> — email and CRM tools
              used only with leads who explicitly opted into our email list.
            </li>
            <li>
              <strong>Stripe</strong> — processes payment when you purchase a
              website. We never see or store your card number.
            </li>
          </ul>
          <p>
            We do not sell your information. We do not share it with
            advertising networks. We do not use it to train AI models.
          </p>

          <p className="mt-4 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
            <strong>SMS-specific carve-out (T-Mobile / AT&amp;T / Verizon required wording):</strong>
            <br />
            All the above categories exclude text messaging originator opt-in
            data and consent; this information will not be shared with any
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. SMS messaging program details</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Program name:</strong> wediditforyou outreach &amp;
              service messages.
            </li>
            <li>
              <strong>What you&apos;ll receive:</strong> a personalized first
              message offering a free website preview built from your public
              Google Maps listing, plus follow-ups only if you reply.
            </li>
            <li>
              <strong>Frequency:</strong> typically one message; up to four
              per month if you actively engage.
            </li>
            <li>
              <strong>Opt-in:</strong> we contact you because your business is
              publicly listed in a directory like Google Maps or Yelp. Your
              first reply (any reply other than STOP) is treated as opt-in
              for follow-up.
            </li>
            <li>
              <strong>Opt-out:</strong> reply <strong>STOP</strong> to any
              message. We will stop messaging you within minutes and
              permanently. Reply <strong>HELP</strong> for help or email{" "}
              <a
                href="mailto:aljaz.rojko@gmail.com"
                className="underline"
              >
                aljaz.rojko@gmail.com
              </a>
              .
            </li>
            <li>
              <strong>Cost:</strong> message and data rates may apply per
              your wireless carrier&apos;s plan.
            </li>
            <li>
              <strong>Carriers:</strong> we do not guarantee delivery on any
              specific carrier. T-Mobile, AT&amp;T, Verizon, and others are
              not liable for delayed or undelivered messages.
            </li>
            <li>
              <strong>Supported carriers:</strong> all major US carriers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Your rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Request a copy of the data we hold about you, or its deletion,
              by emailing{" "}
              <a href="mailto:aljaz.rojko@gmail.com" className="underline">
                aljaz.rojko@gmail.com
              </a>
              . We respond within 30 days.
            </li>
            <li>
              California residents have additional rights under CCPA / CPRA:
              right to know, right to delete, right to correct, right to opt
              out of any sale or sharing (we do neither).
            </li>
            <li>
              Stop receiving SMS at any time by replying STOP. Stop receiving
              email by clicking the unsubscribe link in any email.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Children</h2>
          <p>
            This service is for businesses, not children. We do not
            knowingly collect data from anyone under 13. If you believe a
            minor&apos;s data is here, email us and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Changes to this policy</h2>
          <p>
            We will update the &quot;Last updated&quot; date at the top of
            this page whenever this policy changes. Material changes that
            affect how we use your data will be communicated by email to
            anyone with an active account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>
            wediditforyou
            <br />
            Email:{" "}
            <a href="mailto:aljaz.rojko@gmail.com" className="underline">
              aljaz.rojko@gmail.com
            </a>
            <br />
            SMS opt-out: reply STOP to any of our messages.
          </p>
        </section>
      </div>
    </main>
  );
}
