import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";

export const dynamic = "force-dynamic";

type InboundMessage = {
  id: number;
  received_at: string;
  from_phone: string;
  to_phone: string;
  body: string | null;
  lead_id: string | null;
};

type LeadStub = { id: string; name: string; slug: string | null; city: string };

async function loadInbox(): Promise<{ messages: InboundMessage[]; leads: Record<string, LeadStub> }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { messages: [], leads: {} };
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: msgs } = await supabase
    .from("inbound_messages")
    .select("id, received_at, from_phone, to_phone, body, lead_id")
    .order("received_at", { ascending: false })
    .limit(200);

  const messages = (msgs ?? []) as InboundMessage[];
  const leadIds = Array.from(
    new Set(messages.map((m) => m.lead_id).filter((x): x is string => x != null)),
  );

  let leadsMap: Record<string, LeadStub> = {};
  if (leadIds.length > 0) {
    const { data: leadRows } = await supabase
      .from("leads")
      .select("id, name, slug, city")
      .in("id", leadIds);
    leadsMap = Object.fromEntries(
      ((leadRows ?? []) as LeadStub[]).map((l) => [l.id, l]),
    );
  }
  return { messages, leads: leadsMap };
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InboxPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const { messages, leads } = await loadInbox();

  return (
    <>
      <AdminNav />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Inbox</h1>
        <p className="text-sm text-zinc-500 mb-6">
          {messages.length} inbound message{messages.length === 1 ? "" : "s"} received.
          Replies are auto-matched to leads when the phone number matches.
        </p>
        {messages.length === 0 ? (
          <div className="border border-zinc-900 rounded-lg p-12 text-center text-zinc-500">
            No replies yet. Inbound SMS will appear here once the SignalWire webhook is
            wired to <code className="text-zinc-300">/api/webhooks/signalwire/sms</code>.
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m: InboundMessage) => {
              const leadId: string | null = m.lead_id;
              const lead: LeadStub | null =
                leadId !== null ? leads[leadId] ?? null : null;
              return (
                <li
                  key={m.id}
                  className="border border-zinc-900 rounded-lg p-4 bg-zinc-900/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="text-zinc-300 font-medium">{m.from_phone}</span>
                      {lead && (
                        <>
                          <span className="text-zinc-600"> · </span>
                          <span className="text-emerald-400">
                            {lead.name} ({lead.city})
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{fmtTime(m.received_at)}</div>
                  </div>
                  <p className="text-zinc-100 whitespace-pre-wrap">{m.body ?? "(no body)"}</p>
                  {lead?.slug && (
                    <div className="mt-3 flex gap-3 text-xs">
                      <a
                        href={`https://sites.wedidit4you.com/${lead.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        view their site ↗
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
