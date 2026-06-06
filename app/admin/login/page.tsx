import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin");
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">We Did It For You</h1>
        <p className="text-zinc-400 text-sm mb-6">Admin sign-in</p>
        <LoginForm />
      </div>
    </main>
  );
}
