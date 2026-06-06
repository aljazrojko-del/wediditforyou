"use client";

export default function SignOutButton() {
  async function signOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm text-zinc-400 hover:text-rose-400"
    >
      Sign out
    </button>
  );
}
