import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import { buildBuyLink } from "@/lib/buy-link";
import AdminNav from "./_components/AdminNav";
import LeadRow, { type LeadRowData } from "./_components/LeadRow";
import LeadFilters from "./_components/LeadFilters";
import BlastButton from "./_components/BlastButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function loadCities(): Promise<string[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("leads").select("city").not("city", "is", null);
  if (!data) return [];
  return Array.from(new Set(data.map((r) => r.city as string).filter(Boolean))).sort();
}

async function loadLeads(params: { city?: string; status?: string; niche?: string; grade?: string; q?: string }): Promise<LeadRowData[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Parse grade param: "A,B" (default) → ['A_ELITE','B_HOT']. "all" clears filter.
  const GRADE_MAP: Record<string, string> = {
    A: "A_ELITE", B: "B_HOT", C: "C_WARM", D: "D_MID", E: "E_SUSPECT",
  };
  const gradeInput = (params.grade ?? "A,B").trim();
  const grades: string[] | null =
    gradeInput.toLowerCase() === "all"
      ? null
      : gradeInput
          .split(",")
          .map((g) => g.trim().toUpperCase())
          .map((g) => GRADE_MAP[g] ?? g)
          .filter((g) => g.length > 0);

  // Free-text search: bypass the "callable-lead" filters (has_website=false,
  // slug/site_url present) so Aljaz can locate ANY business by name — even
  // ones without a generated site yet — for manual lookups.
  const searchTerm = (params.q ?? "").trim();
  const isSearching = searchTerm.length >= 2;

  // Cast away the chained-filter type narrowing — it blows up TS2589 otherwise.
  // The result is re-asserted to LeadRowData[] at the end.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("leads")
    .select(
      "id, name, slug, city, niche, phone, site_url, owner_first_name, owner_last_name, owner_title, owner_email, owner_phone, owner_name, email, email_status, rating, rating_count, sms_sent_at, call_placed_at, inbound_count, last_inbound_at, has_website, payment_status, tier, customer_admin_token, address, source, place_id, types, facebook_url, company_domain, google_review_url, enrichment_data, enriched_at, generated_at, created_at, website_url, quality_grade",
    )
    .not("phone", "is", null)
    .order("quality_grade", { ascending: true, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .order("rating_count", { ascending: false, nullsFirst: false })
    .limit(PAGE_SIZE);

  // "Ready to call" filters only apply when NOT searching. During search we
  // want to find the business even if we haven't generated a site for it yet.
  if (!isSearching) {
    q = q
      .eq("has_website", false)
      .not("slug", "is", null)
      .not("site_url", "is", null);
  }

  if (isSearching) {
    // ilike is case-insensitive substring match. Escape '%' and '_' in the
    // user's input so they can't accidentally match everything or confuse
    // the pattern parser.
    const safe = searchTerm.replace(/[%_]/g, (m) => `\\${m}`);
    q = q.ilike("name", `%${safe}%`);
  }

  if (grades && grades.length > 0 && !isSearching) q = q.in("quality_grade", grades);
  if (params.city) q = q.eq("city", params.city);
  if (params.niche) q = q.eq("niche", params.niche);
  if (params.status === "untouched") q = q.is("sms_sent_at", null).is("call_placed_at", null);
  else if (params.status === "sms-sent") q = q.not("sms_sent_at", "is", null);
  else if (params.status === "called") q = q.not("call_placed_at", "is", null);
  else if (params.status === "inbound") q = q.gt("inbound_count", 0);

  const { data, error } = await q;
  if (error) {
    console.error("[admin/page] loadLeads error:", error.message);
    return [];
  }
  // Bake per-lead URLs server-side so the dashboard can copy them with one
  // click. Stripe buy URL includes ?client_reference_id={slug} so the webhook
  // can match the payment. Customer-link is the self-service /my-site/{token}.
  const siteOrigin = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
  return (
    (data ?? []) as Array<
      Omit<
        LeadRowData,
        | "buy_link_starter_full"
        | "buy_link_starter_split"
        | "buy_link_premium_full"
        | "buy_link_premium_split"
        | "customer_link"
      > & { customer_admin_token: string | null }
    >
  ).map((l) => ({
    ...l,
    buy_link_starter_full: buildBuyLink("starter-full", { slug: l.slug, email: l.email }),
    buy_link_starter_split: buildBuyLink("starter-split", { slug: l.slug, email: l.email }),
    buy_link_premium_full: buildBuyLink("premium-full", { slug: l.slug, email: l.email }),
    buy_link_premium_split: buildBuyLink("premium-split", { slug: l.slug, email: l.email }),
    customer_link: l.customer_admin_token
      ? `${siteOrigin}/my-site/${l.customer_admin_token}`
      : null,
  }));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; status?: string; niche?: string; grade?: string; q?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin/login");

  const sp = await searchParams;
  const [cities, leads] = await Promise.all([loadCities(), loadLeads(sp)]);

  const filterParams: Record<string, string> = {};
  if (sp.city) filterParams.city = sp.city;
  if (sp.niche) filterParams.niche = sp.niche;
  if (sp.status) filterParams.status = sp.status;
  if (sp.grade) filterParams.grade = sp.grade;
  if (sp.q) filterParams.q = sp.q;
  const searchQuery = (sp.q ?? "").trim();
  const isSearching = searchQuery.length >= 2;

  // For Blast safety: only allow batch when SMS is the action AND status is "untouched"
  // (or the user has explicitly filtered to a city/niche).
  const blastEligible = leads.filter((l) => l.phone && l.slug && !l.sms_sent_at);

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {leads.length} shown
              {isSearching ? ` matching "${searchQuery}"` : ""}
              {sp.city ? ` in ${sp.city}` : ""}
              {sp.niche ? ` · ${sp.niche}` : ""}
              {isSearching && (
                <span className="ml-2 text-xs text-amber-400">
                  (search bypasses grade + &quot;ready to call&quot; filters)
                </span>
              )}
            </p>
          </div>
          <LeadFilters cities={cities} />
        </div>

        <div className="mb-4">
          <BlastButton filterParams={filterParams} count={blastEligible.length} />
        </div>

        <div className="overflow-x-auto border border-zinc-900 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/50">
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Business</th>
                <th className="px-3 py-2 font-medium">Phone / Owner</th>
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-zinc-500">
                    No leads match the current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
