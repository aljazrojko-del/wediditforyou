// SignalWire-based auto-review SMS runner. Sends Google review requests to
// the END CUSTOMERS of Premium-tier business owners after a job is marked
// complete. Replaces the legacy OpenPhone version on a SignalWire channel.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SignalWireClient } from "./signalwire-client";
import { normalizeE164 } from "./outreach";

type ReviewLead = {
  id: string;
  name: string;
  phone: string | null;
  city: string;
  owner_first_name: string | null;
  google_review_url: string | null;
};

export async function sendReviewRequests(
  supabase: SupabaseClient,
  opts: { sinceHours?: number; limit?: number } = {},
): Promise<{ sent: number; skipped: number; failed: number }> {
  const sinceHours = opts.sinceHours ?? 1;
  const limit = opts.limit ?? 20;
  const cutoff = new Date(Date.now() - sinceHours * 3600_000).toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, city, owner_first_name, google_review_url")
    .eq("tier", "premium")
    .eq("payment_status", "paid")
    .not("phone", "is", null)
    .not("google_review_url", "is", null)
    .is("review_request_sent_at", null)
    .lt("last_job_completed_at", cutoff)
    .not("last_job_completed_at", "is", null)
    .limit(limit)
    .returns<ReviewLead[]>();

  if (error) throw new Error(`review-sms select failed: ${error.message}`);
  const leads = data ?? [];
  if (leads.length === 0) return { sent: 0, skipped: 0, failed: 0 };

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch {
    return { sent: 0, skipped: leads.length, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    const to = normalizeE164(lead.phone ?? "");
    if (!to) {
      skipped++;
      continue;
    }
    const from = client.pickFromNumber(lead.city);
    if (!from) {
      skipped++;
      continue;
    }
    const customerFirst = lead.owner_first_name ?? "there";
    const body = `Hi ${customerFirst}! Thanks for choosing ${lead.name} today. If you have 30 seconds, would you mind leaving a quick Google review? ${lead.google_review_url} — means a lot. (Reply STOP to opt out.)`;

    const res = await client.sendSms({ from, to, body });
    if (res.ok) {
      await supabase
        .from("leads")
        .update({
          review_request_sent_at: new Date().toISOString(),
          review_request_message_id: res.sid,
          review_sms_via: "signalwire",
        })
        .eq("id", lead.id);
      sent++;
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, skipped, failed };
}
