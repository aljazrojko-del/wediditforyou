import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type LeadRow = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  rating_count: number | null;
  types: string[] | null;
  niche: string;
  city: string;
  has_website: boolean;
  website_url: string | null;
};

export function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function upsertLeads(
  supabase: SupabaseClient,
  rows: LeadRow[],
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  // ignoreDuplicates: re-runs won't error on existing place_ids.
  const { data, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "place_id", ignoreDuplicates: true })
    .select("id");

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);

  const inserted = data?.length ?? 0;
  return { inserted, skipped: rows.length - inserted };
}
