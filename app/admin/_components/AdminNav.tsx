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
          <Link href="/admin/sms" className="text-sm text-zinc-400 hover:text-zinc-100">
            SMS
          </Link>
          <Link href="/admin/book" className="text-sm text-zinc-400 hover:text-zinc-100">
            Book
          </Link>
          <Link href="/admin/recordings" className="text-sm text-zinc-400 hover:text-zinc-100">
            Recordings
          </Link>
          <Link href="/admin/echo" className="text-sm text-zinc-400 hover:text-zinc-100">
            Echo
          </Link>
          <Link href="/admin/call" className="text-sm text-zinc-400 hover:text-zinc-100">
            Call
          </Link>
          <Link href="/admin/alex" className="text-sm text-zinc-400 hover:text-zinc-100">
            Alex
          </Link>
          <Link href="/admin/ai-caller" className="text-sm text-zinc-400 hover:text-zinc-100">
            AI Caller
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
