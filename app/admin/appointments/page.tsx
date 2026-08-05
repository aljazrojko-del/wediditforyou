// /admin/appointments — self-hosted walkthrough calendar (replaces GoHighLevel).
// Reads the Supabase `appointments` table. Upcoming first, then past.

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Appt = {
  id: string;
  phone: string | null;
  first_name: string | null;
  business_name: string | null;
  start_time: string;
  duration_min: number | null;
  status: string;
  site_url: string | null;
  notes: string | null;
  reminder_daybefore_sent_at: string | null;
  reminder_dayof_sent_at: string | null;
};

async function load(): Promise<Appt[]> {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb.from("appointments")
    .select("id, phone, first_name, business_name, start_time, duration_min, status, site_url, notes, reminder_daybefore_sent_at, reminder_dayof_sent_at")
    .order("start_time", { ascending: true });
  return (data as Appt[]) ?? [];
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { timeZone: "America/Chicago", weekday: "long", month: "short", day: "numeric" });
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }) + " CT";
}
function fmtPhone(p: string | null): string {
  if (!p) return "—";
  const d = p.replace(/[^0-9]/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export default async function AppointmentsPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const all = await load();
  const now = Date.now();
  const upcoming = all.filter((a) => a.status === "confirmed" && new Date(a.start_time).getTime() >= now - 2 * 3600_000);
  const past = all.filter((a) => !(a.status === "confirmed" && new Date(a.start_time).getTime() >= now - 2 * 3600_000))
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Group upcoming by CT day.
  const groups = new Map<string, Appt[]>();
  for (const a of upcoming) {
    const k = fmtDay(new Date(a.start_time));
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(a);
  }

  const Card = ({ a }: { a: Appt }) => {
    const start = new Date(a.start_time);
    const rem = [a.reminder_daybefore_sent_at ? "24h" : null, a.reminder_dayof_sent_at ? "1h" : null].filter(Boolean);
    return (
      <div className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="w-24 shrink-0 text-right">
          <div className="text-lg font-semibold text-zinc-100">{fmtTime(start)}</div>
          <div className="text-xs text-zinc-500">{a.duration_min ?? 15} min</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-zinc-100">{a.business_name ?? a.first_name ?? "Walkthrough"}</div>
          <div className="text-sm text-zinc-400">
            {a.first_name ? `${a.first_name} · ` : ""}<a href={`tel:${a.phone ?? ""}`} className="hover:text-zinc-200">{fmtPhone(a.phone)}</a>
          </div>
          {a.site_url && (
            <a href={a.site_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-emerald-400 hover:underline break-all">{a.site_url}</a>
          )}
          {a.notes && <div className="mt-1 text-xs text-zinc-600">{a.notes}</div>}
        </div>
        <div className="shrink-0 text-right">
          <span className={"rounded px-2 py-0.5 text-xs font-medium " + (
            a.status === "confirmed" ? "bg-emerald-900/40 text-emerald-300"
              : a.status === "completed" ? "bg-zinc-800 text-zinc-400"
                : "bg-rose-900/40 text-rose-300")}>{a.status}</span>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
            {rem.length ? `reminded ${rem.join(" + ")}` : "no reminder yet"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AdminNav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">Walkthroughs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {upcoming.length} upcoming · {past.length} past · self-hosted (SMS reminders auto-sent)
          </p>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-zinc-900 p-10 text-center text-zinc-500">No upcoming walkthroughs.</div>
        ) : (
          [...groups.entries()].map(([day, items]) => (
            <div key={day} className="mb-6">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">{day}</div>
              <div className="space-y-2">{items.map((a) => <Card key={a.id} a={a} />)}</div>
            </div>
          ))
        )}

        {past.length > 0 && (
          <div className="mt-10">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">Past &amp; other</div>
            <div className="space-y-2 opacity-70">{past.slice(0, 50).map((a) => <Card key={a.id} a={a} />)}</div>
          </div>
        )}
      </div>
    </>
  );
}
