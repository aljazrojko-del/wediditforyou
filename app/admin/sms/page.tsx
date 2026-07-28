// Admin SMS composer — write custom text to any number.
// Uses /api/outreach/send-link with a custom sms_body + optional from_phone.
// Every attempt lands in outbound_messages (via Path B logging), so silent
// carrier drops still show up in the audit trail.

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import SmsComposer from "./SmsComposer";

export const dynamic = "force-dynamic";

export default async function SmsPage() {
  const ok = await isAuthed();
  if (!ok) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Send SMS
        </h1>
        <p className="text-sm text-zinc-400 mb-8">
          Write a custom text to any phone number. Pick a from-number if you
          need to send from a specific region. Every send is logged to{" "}
          <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">
            outbound_messages
          </code>{" "}
          — even if the carrier silently drops it.
        </p>
        <SmsComposer />
      </div>
    </main>
  );
}
