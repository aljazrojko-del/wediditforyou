// Minimal shell — every admin page provides its own auth check + nav.
// Keeping this layout deliberately empty avoids the login-page-redirect-loop
// that comes from doing auth in the layout itself.

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-100">{children}</div>;
}
