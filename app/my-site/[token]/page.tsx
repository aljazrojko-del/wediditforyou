// Customer self-service page. Lives at /my-site/{customer_admin_token}.
// Possession of the token = auth. Customer sees their live site preview
// and a "Request a change" form that triggers an AI-assisted content update.

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ChangeRequestForm from "./ChangeRequestForm";
import DomainForm from "./DomainForm";
import StatusPanel from "./StatusPanel";

type Stage =
  | "awaiting_domain"
  | "domain_registered"
  | "site_deployed"
  | "awaiting_approval"
  | "approved"
  | "in_30_day_window"
  | "refund_pending"
  | "refunded"
  | "closed_won"
  | "deploy_failed"
  | "ghosted";

export const dynamic = "force-dynamic";

type LeadView = {
  id: string;
  name: string;
  slug: string;
  city: string;
  site_url: string | null;
  payment_status: string | null;
  tier: string | null;
};

type OnboardingView = {
  domain_requested: string | null;
  domain_registered: string | null;
  stage: string;
  customer_approved: boolean;
  thirty_day_deadline: string | null;
};

async function loadLeadAndOnboarding(
  token: string,
): Promise<{ lead: LeadView; onboarding: OnboardingView | null } | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, slug, city, site_url, payment_status, tier")
    .eq("customer_admin_token", token)
    .maybeSingle<LeadView>();
  if (!lead) return null;
  const { data: onboarding } = await supabase
    .from("onboarding_state")
    .select(
      "domain_requested, domain_registered, stage, customer_approved, thirty_day_deadline",
    )
    .eq("lead_id", lead.id)
    .maybeSingle<OnboardingView>();
  return { lead, onboarding: onboarding ?? null };
}

type Metrics = { visits: number; calls: number; bookings: number };

// Last-30-day counts from site_events for this customer's live site.
async function loadMetrics(leadId: string): Promise<Metrics | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const countOf = async (type: string): Promise<number> => {
    const { count } = await supabase
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("type", type)
      .gte("created_at", since);
    return count ?? 0;
  };
  const [visits, calls, bookings] = await Promise.all([
    countOf("visit"),
    countOf("call_click"),
    countOf("booking_click"),
  ]);
  return { visits, calls, bookings };
}

export default async function MySitePage(
  props: { params: Promise<{ token: string }> },
) {
  const { token } = await props.params;
  const ctx = await loadLeadAndOnboarding(token);
  if (!ctx) notFound();
  const { lead, onboarding } = ctx;
  const metrics = lead.tier === "premium" ? await loadMetrics(lead.id) : null;

  return (
    <main className="min-h-screen bg-[#FAF6F0] text-[#1F1814]">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-[#C2410C]">
          Your site
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {lead.name}
        </h1>
        <p className="mt-2 text-sm text-[#1F1814]/65">{lead.city}</p>

        {lead.site_url && (
          <a
            href={lead.site_url}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#1F1814]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1F1814] transition hover:border-[#C2410C] hover:text-[#C2410C]"
          >
            View live site ↗
          </a>
        )}

        {onboarding && (
          <StatusPanel
            token={token}
            stage={onboarding.stage as Stage}
            domainRegistered={onboarding.domain_registered}
            thirtyDayDeadline={onboarding.thirty_day_deadline}
            customerApproved={onboarding.customer_approved}
          />
        )}

        {metrics && (
          <div className="mt-12 rounded-3xl border border-[#1F1814]/10 bg-white p-7 sm:p-10">
            <h2 className="text-xl font-semibold">Your numbers</h2>
            <p className="mt-2 text-sm text-[#1F1814]/65">
              Live from your site — last 30 days. Real proof it&apos;s working.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Visits", value: metrics.visits },
                { label: "Calls", value: metrics.calls },
                { label: "Bookings", value: metrics.bookings },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-[#FAF6F0] p-5 text-center"
                >
                  <div className="text-3xl font-semibold text-[#C2410C]">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[#1F1814]/55">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#1F1814]/45">
              &quot;Calls&quot; and &quot;Bookings&quot; count taps on your phone
              number and booking button — updated live as customers use your site.
            </p>
          </div>
        )}

        {onboarding && (
          <div className="mt-12 rounded-3xl border border-[#1F1814]/10 bg-white p-7 sm:p-10">
            <h2 className="text-xl font-semibold">Your domain</h2>
            <p className="mt-2 text-sm text-[#1F1814]/65">
              Pick the .com you want to be known by. We register it instantly and
              your site goes live at that address.
            </p>
            <div className="mt-5">
              <DomainForm
                token={token}
                existingDomain={onboarding.domain_registered}
              />
            </div>
          </div>
        )}

        <div className="mt-12 rounded-3xl border border-[#1F1814]/10 bg-white p-7 sm:p-10">
          <h2 className="text-xl font-semibold">Request a change</h2>
          <p className="mt-2 text-sm text-[#1F1814]/65">
            Tell us what to update — phone number, hours, services, photos,
            anything. We&apos;ll apply it within seconds. No need to email or
            call.
          </p>

          <div className="mt-6">
            <ChangeRequestForm token={token} />
          </div>

          <div className="mt-8 rounded-xl bg-[#FAF6F0] p-4 text-xs text-[#1F1814]/55">
            <strong className="block text-[#1F1814]/70">Examples</strong>
            <ul className="mt-2 grid gap-1">
              <li>· Change my phone number to (713) 555-1234</li>
              <li>· Update business hours to 8am-7pm Monday-Saturday</li>
              <li>· Add a new service: &quot;Tire rotation — $45 mobile&quot;</li>
              <li>· Make the headline shorter and more direct</li>
              <li>· Remove the third review and replace with this one: ...</li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#1F1814]/45">
          Bigger changes (rebrand, new pages, logo)? Email{" "}
          <a href="mailto:info@wedidit4you.com" className="underline">
            info@wedidit4you.com
          </a>
        </p>
      </div>
    </main>
  );
}
