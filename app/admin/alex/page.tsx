import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import AlexWidget from "./AlexWidget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AlexPage() {
  if (!(await isAuthed())) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Talk to Alex</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Your AI cold-call agent. Click the widget in the corner, allow your
          microphone, and say &quot;Hello?&quot; like you just answered a call — Alex
          runs the full script (opener, the 4.7-star compliment, the free-preview
          reveal, and asks to text you the link).
        </p>
        <AlexWidget />
      </div>
    </main>
  );
}
