import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import SmsClient from "./SmsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SmsPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-1">Quick SMS</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Type any US number, send a message, see the full chat history.
        </p>
        <SmsClient />
      </div>
    </>
  );
}
