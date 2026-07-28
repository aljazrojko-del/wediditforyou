// Browser voice calling — click, talk to a real US phone number from the
// admin UI without ever picking up a physical phone. Uses @signalwire/js v4
// WebRTC to route through SignalWire's cloud. Server mints a short-lived JWT
// via /api/admin/voice-token; the browser connects with it, dials, and
// streams audio via WebRTC.

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import WebPhone from "./WebPhone";

export const dynamic = "force-dynamic";

export default async function CallPage() {
  const ok = await isAuthed();
  if (!ok) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Web phone
        </h1>
        <p className="text-sm text-zinc-400 mb-8">
          Dial a US number directly from the browser. Real bi-directional
          audio via WebRTC — plug in a headset, grant mic permission, and talk.
          Uses your SignalWire account.
        </p>
        <WebPhone />
      </div>
    </main>
  );
}
