// 30-day window reminders. Customers get nudges at day 15, 25, and 28 of the
// 30-day satisfaction window so they don't ghost the approval / refund-window
// closure. Each reminder is idempotent — the `reminders_sent` jsonb tracks
// which day_markers have already been sent.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SignalWireClient } from "./signalwire-client";
import { normalizeE164, pickFirstName } from "./outreach";

const SITE_BASE = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";

type ReminderRow = {
  onboarding_id: string;
  lead_id: string;
  thirty_day_deadline: string;
  reminders_sent: Array<{ day_marker: number; sent_at: string; message_id?: string }>;
  stage: string;
  lead_name: string;
  lead_phone: string | null;
  lead_city: string;
  lead_owner_first_name: string | null;
  lead_customer_admin_token: string | null;
};

const DAY_MARKERS = [15, 25, 28] as const;

function bodyForMarker(opts: {
  firstName: string;
  daysLeft: number;
  customerLink: string;
  marker: number;
}): string {
  if (opts.marker === 28) {
    return `Hi ${opts.firstName}, Alex here — ${opts.daysLeft} days left in your 30-day window. Last chance to approve or request changes: ${opts.customerLink} — Reply STOP to opt out.`;
  }
  if (opts.marker === 25) {
    return `Hi ${opts.firstName}, Alex from We Did It For You. You have ${opts.daysLeft} days left to approve your site or request changes — ${opts.customerLink}`;
  }
  return `Hi ${opts.firstName}, Alex checking in. Halfway through your 30-day window. Any changes? Approve or edit here: ${opts.customerLink}`;
}

export async function sendReminders(
  supabase: SupabaseClient,
): Promise<{ sent: number; skipped: number; failed: number }> {
  // Fetch every onboarding row whose 30-day window is active and not refunded.
  const { data: rawRows, error } = await supabase
    .from("onboarding_state")
    .select(
      `id, lead_id, thirty_day_deadline, reminders_sent, stage,
       leads (name, phone, city, owner_first_name, customer_admin_token)`,
    )
    .not("thirty_day_deadline", "is", null)
    .eq("refund_requested", false)
    .in("stage", [
      "site_deployed",
      "awaiting_approval",
      "in_30_day_window",
      "approved",
    ])
    .limit(200);

  if (error) throw new Error(`reminders select failed: ${error.message}`);
  if (!rawRows || rawRows.length === 0) return { sent: 0, skipped: 0, failed: 0 };

  // Normalize the join result (supabase returns leads as either object or array).
  const rows: ReminderRow[] = (rawRows as unknown as Array<Record<string, unknown>>)
    .map((r) => {
      const lead = Array.isArray(r.leads)
        ? (r.leads[0] as Record<string, unknown> | undefined)
        : (r.leads as Record<string, unknown> | undefined);
      if (!lead) return null;
      return {
        onboarding_id: r.id as string,
        lead_id: r.lead_id as string,
        thirty_day_deadline: r.thirty_day_deadline as string,
        reminders_sent: (r.reminders_sent as ReminderRow["reminders_sent"]) ?? [],
        stage: r.stage as string,
        lead_name: lead.name as string,
        lead_phone: (lead.phone as string | null) ?? null,
        lead_city: lead.city as string,
        lead_owner_first_name: (lead.owner_first_name as string | null) ?? null,
        lead_customer_admin_token:
          (lead.customer_admin_token as string | null) ?? null,
      };
    })
    .filter((x): x is ReminderRow => x !== null);

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch {
    return { sent: 0, skipped: rows.length, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.lead_phone || !row.lead_customer_admin_token) {
      skipped++;
      continue;
    }

    const deadline = new Date(row.thirty_day_deadline).getTime();
    const now = Date.now();
    const daysLeft = Math.ceil((deadline - now) / 86_400_000);
    const daysIntoWindow = 30 - daysLeft;

    // Find the highest marker that has been hit but not yet sent.
    const sentMarkers = new Set(row.reminders_sent.map((r) => r.day_marker));
    const dueMarker = DAY_MARKERS.find(
      (m) => daysIntoWindow >= m && !sentMarkers.has(m),
    );
    if (dueMarker === undefined) {
      skipped++;
      continue;
    }

    const to = normalizeE164(row.lead_phone);
    if (!to) {
      skipped++;
      continue;
    }
    const from = client.pickFromNumber(row.lead_city);
    if (!from) {
      skipped++;
      continue;
    }

    const body = bodyForMarker({
      firstName: pickFirstName({
        name: row.lead_name,
        owner_first_name: row.lead_owner_first_name,
      }),
      daysLeft: Math.max(0, daysLeft),
      customerLink: `${SITE_BASE}/my-site/${row.lead_customer_admin_token}`,
      marker: dueMarker,
    });

    const res = await client.sendSms({ from, to, body });
    if (res.ok) {
      const nextReminders = [
        ...row.reminders_sent,
        { day_marker: dueMarker, sent_at: new Date().toISOString(), message_id: res.sid },
      ];
      await supabase
        .from("onboarding_state")
        .update({ reminders_sent: nextReminders })
        .eq("id", row.onboarding_id);
      sent++;
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, skipped, failed };
}
