import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import OnboardingRow, { type OnboardingRowData } from "./OnboardingRow";

export const dynamic = "force-dynamic";

async function loadOnboarding(): Promise<OnboardingRowData[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("onboarding_state")
    .select(
      `id, stage, thirty_day_deadline, domain_requested, domain_registered,
       site_url, refund_requested, reminders_sent, created_at, updated_at,
       leads (id, name, slug, city, phone, tier, customer_admin_token, welcome_sms_sent_at)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/onboarding] error:", error.message);
    return [];
  }

  const siteOrigin = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
  return ((data ?? []) as unknown as Array<Record<string, unknown>>)
    .map((r) => {
      const lead = Array.isArray(r.leads)
        ? (r.leads[0] as Record<string, unknown> | undefined)
        : (r.leads as Record<string, unknown> | undefined);
      if (!lead) return null;
      const token = lead.customer_admin_token as string | null;
      return {
        id: r.id as string,
        stage: r.stage as OnboardingRowData["stage"],
        thirty_day_deadline: (r.thirty_day_deadline as string | null) ?? null,
        domain_requested: (r.domain_requested as string | null) ?? null,
        domain_registered: (r.domain_registered as string | null) ?? null,
        site_url: (r.site_url as string | null) ?? null,
        refund_requested: Boolean(r.refund_requested),
        reminders_sent: (r.reminders_sent as Array<{ day_marker: number }>) ?? [],
        created_at: r.created_at as string,
        lead_name: lead.name as string,
        lead_slug: (lead.slug as string | null) ?? null,
        lead_city: lead.city as string,
        lead_phone: (lead.phone as string | null) ?? null,
        lead_tier: (lead.tier as string | null) ?? null,
        welcome_sms_sent_at: (lead.welcome_sms_sent_at as string | null) ?? null,
        customer_link: token ? `${siteOrigin}/my-site/${token}` : null,
      };
    })
    .filter((x): x is OnboardingRowData => x !== null);
}

export default async function OnboardingPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const rows = await loadOnboarding();

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-sm text-zinc-500">{rows.length} active customer{rows.length === 1 ? "" : "s"}</p>
        </div>

        {rows.length === 0 ? (
          <div className="border border-zinc-900 rounded-lg p-12 text-center text-zinc-500">
            No paying customers yet. Onboarding rows are created automatically when Stripe fires <code className="text-zinc-300">checkout.session.completed</code>.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <OnboardingRow key={r.id} row={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
