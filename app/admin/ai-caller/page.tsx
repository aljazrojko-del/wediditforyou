import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import AiCallerClient from "./AiCallerClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AiCallerPage() {
  if (!(await isAuthed())) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">AI Call Launcher</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Have Alex place cold calls — either dial a single number by hand, or run
          automatically through your callable leads with a set number of calls in parallel.
        </p>
        <AiCallerClient />
      </div>
    </main>
  );
}
