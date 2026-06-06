"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Sign-in failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="password"
        autoFocus
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none"
      />
      <button
        type="submit"
        disabled={loading || !pw}
        className="w-full py-3 rounded-md bg-white text-zinc-950 font-medium hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      {err && <p className="text-rose-400 text-sm">{err}</p>}
    </form>
  );
}
