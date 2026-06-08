import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function AdminNav() {
  return (
    <nav className="border-b border-zinc-900 bg-zinc-950/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold tracking-tight">
            wdy admin
          </Link>
          <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-100">
            Leads
          </Link>
          <Link href="/admin/pull" className="text-sm text-zinc-400 hover:text-zinc-100">
            Pull new
          </Link>
          <Link href="/admin/inbox" className="text-sm text-zinc-400 hover:text-zinc-100">
            Inbox
          </Link>
          <Link href="/admin/onboarding" className="text-sm text-zinc-400 hover:text-zinc-100">
            Onboarding
          </Link>
        </div>
        <SignOutButton />
      </div>
    </nav>
  );
}
