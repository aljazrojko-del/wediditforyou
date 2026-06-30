// Ad-hoc SMS send + two-way conversation thread fetch.
// Used by /admin/sms — type any number, send a message, see the full chat.
// Server-only.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SignalWireClient } from "@/lib/signalwire-client";
import { normalizeE164 } from "@/lib/outreach";

// Houston is NOT linked to the approved A2P campaign yet, so it returns
// "must send to a verified caller id" for every external destination.
// Dallas IS linked — use it as the Quick SMS default until Houston is
// attached to "Wedidit4you Capm1" in the SignalWire dashboard.
const DEFAULT_FROM =
  process.env.SIGNALWIRE_PHONE_DALLAS ??
  process.env.SIGNALWIRE_PHONE_HOUSTON ??
  "";

export type ThreadMessage = {
  id: string;
  direction: "in" | "out";
  at: string;
  body: string;
  from_phone: string;
  to_phone: string;
  status?: string | null;
  error?: string | null;
};

function digitsOnly(p: string): string {
  return (p ?? "").replace(/[^0-9]/g, "");
}

function last10(p: string): string {
  return digitsOnly(p).slice(-10);
}

export async function sendQuickSms(
  supabase: SupabaseClient,
  args: { to: string; body: string },
): Promise<
  | { ok: true; sid: string; from: string; to: string }
  | { ok: false; error: string }
> {
  const to = normalizeE164(args.to);
  if (!to) return { ok: false, error: "Phone could not be normalized (US 10-digit or E.164)" };

  const body = (args.body ?? "").trim();
  if (!body) return { ok: false, error: "Message body is empty" };
  if (body.length > 1600) {
    return { ok: false, error: "Message too long (1600 char max)" };
  }
  if (!DEFAULT_FROM) {
    return {
      ok: false,
      error: "No working SignalWire from-number configured (Dallas/Houston env both missing)",
    };
  }

  let client: SignalWireClient;
  try {
    client = new SignalWireClient();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  // Default outbound: Dallas (Houston not linked to campaign yet — see comment
  // at DEFAULT_FROM above). Future iteration can area-code-route here too.
  const from = DEFAULT_FROM;

  // Best-effort lead lookup by recipient's last 10 digits so the thread
  // can show the lead's name when the number matches.
  let leadId: string | null = null;
  try {
    const { data } = await supabase
      .from("leads")
      .select("id, phone")
      .not("phone", "is", null)
      .limit(500);
    if (data) {
      const target = last10(to);
      for (const row of data as { id: string; phone: string | null }[]) {
        if (row.phone && last10(row.phone) === target) {
          leadId = row.id;
          break;
        }
      }
    }
  } catch {
    // Silent — outbound shouldn't fail because lead lookup blew up.
  }

  const res = await client.sendSms({ from, to, body });
  if (!res.ok) {
    await supabase.from("outbound_messages").insert({
      from_phone: from,
      to_phone: to,
      body,
      message_sid: res.sid ?? null,
      lead_id: leadId,
      status: "failed",
      error: res.error ?? null,
    });
    return { ok: false, error: res.error ?? "SignalWire send failed" };
  }

  await supabase.from("outbound_messages").insert({
    from_phone: from,
    to_phone: to,
    body,
    message_sid: res.sid ?? null,
    lead_id: leadId,
    status: "sent",
  });

  return { ok: true, sid: res.sid!, from, to };
}

export async function getThread(
  supabase: SupabaseClient,
  phone: string,
): Promise<{
  phone: string;
  leadId: string | null;
  leadName: string | null;
  messages: ThreadMessage[];
}> {
  const normalized = normalizeE164(phone) ?? phone;
  const last = last10(normalized);

  // Lead lookup for the header.
  let leadId: string | null = null;
  let leadName: string | null = null;
  try {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, phone")
      .not("phone", "is", null)
      .limit(500);
    if (leads) {
      for (const row of leads as { id: string; name: string | null; phone: string }[]) {
        if (last10(row.phone) === last) {
          leadId = row.id;
          leadName = row.name;
          break;
        }
      }
    }
  } catch {
    // Header just falls back to the phone number.
  }

  // Pull inbound + outbound for this phone. Last-10-digit match handles
  // formatting drift between Google Places phones and E.164.
  const [inbound, outbound] = await Promise.all([
    supabase
      .from("inbound_messages")
      .select("id, received_at, from_phone, to_phone, body")
      .order("received_at", { ascending: true })
      .limit(500),
    supabase
      .from("outbound_messages")
      .select("id, sent_at, from_phone, to_phone, body, status, error")
      .order("sent_at", { ascending: true })
      .limit(500),
  ]);

  const messages: ThreadMessage[] = [];

  for (const m of (inbound.data ?? []) as Array<{
    id: number;
    received_at: string;
    from_phone: string;
    to_phone: string;
    body: string | null;
  }>) {
    if (last10(m.from_phone) === last) {
      messages.push({
        id: `in-${m.id}`,
        direction: "in",
        at: m.received_at,
        body: m.body ?? "",
        from_phone: m.from_phone,
        to_phone: m.to_phone,
      });
    }
  }

  for (const m of (outbound.data ?? []) as Array<{
    id: number;
    sent_at: string;
    from_phone: string;
    to_phone: string;
    body: string | null;
    status: string | null;
    error: string | null;
  }>) {
    if (last10(m.to_phone) === last) {
      messages.push({
        id: `out-${m.id}`,
        direction: "out",
        at: m.sent_at,
        body: m.body ?? "",
        from_phone: m.from_phone,
        to_phone: m.to_phone,
        status: m.status,
        error: m.error,
      });
    }
  }

  messages.sort((a, b) => a.at.localeCompare(b.at));

  return { phone: normalized, leadId, leadName, messages };
}
