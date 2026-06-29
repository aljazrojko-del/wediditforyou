"use client";

// Invisible analytics beacon rendered on every live customer site.
// - Fires one "visit" per browser session.
// - Listens (capture phase) for taps on tel: links -> "call_click" and on
//   booking links (#book / cal.com) -> "booking_click".
// Uses sendBeacon so events still fire even as the tap navigates away.

import { useEffect } from "react";

export default function SiteTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (type: string) => {
      try {
        const body = JSON.stringify({ slug, type });
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/track",
            new Blob([body], { type: "application/json" }),
          );
        } else {
          fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* analytics must never break the page */
      }
    };

    // Count one visit per session.
    try {
      const key = `sv_${slug}`;
      if (!sessionStorage.getItem(key)) {
        send("visit");
        sessionStorage.setItem(key, "1");
      }
    } catch {
      send("visit");
    }

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("tel:")) send("call_click");
      else if (href.includes("#book") || href.includes("cal.com")) send("booking_click");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [slug]);

  return null;
}
