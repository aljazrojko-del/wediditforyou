import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import AdminNav from "../_components/AdminNav";
import BookClient from "./BookClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Book — Admin" };

export default async function BookPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-1">Book appointment</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Manual bridge while Mia&apos;s post-call handler learns to POST
          bookings on its own. Creates a GHL walkthrough appointment, sends
          the combined preview-link + confirmation SMS.
        </p>
        <BookClient />
      </div>
    </>
  );
}
