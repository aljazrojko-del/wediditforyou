import { NextResponse, type NextRequest } from "next/server";

// Map sites.wedidit4you.com/{slug} -> /sites/{slug} internally,
// so a single Next app serves both the main brand site and per-lead sites.
const SITES_HOST = "sites.wedidit4you.com";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  if (!host.startsWith(SITES_HOST)) return NextResponse.next();

  const url = req.nextUrl.clone();
  // Pass through: root, /sites/* (already-routed), /_next/*, /api/*, /gallery/*
  // (shared static assets), and anything with a file extension (favicon, etc.).
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/sites/") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/gallery/") ||
    /\.[a-z0-9]{2,5}$/i.test(url.pathname)
  ) {
    return NextResponse.next();
  }
  url.pathname = `/sites${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
