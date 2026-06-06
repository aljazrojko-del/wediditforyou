import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import PullForm from "./PullForm";

export const dynamic = "force-dynamic";

export default async function PullPage() {
  if (!(await isAuthed())) redirect("/admin/login");

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Pull new leads</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Searches Google Places for businesses in the chosen niche + city, filters out
          anyone who already has a website, and auto-generates a preview site for each
          new lead. Then enriches with owner first-name and email.
        </p>
        <PullForm />
      </div>
    </>
  );
}
