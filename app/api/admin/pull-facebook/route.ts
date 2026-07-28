// POST /api/admin/pull-facebook — Serper-based Facebook business-page discovery.
//
// Direct Facebook Search API is dead (Meta deprecated /search?type=page in 2018).
// Instead we ask Google via Serper for facebook.com pages matching {niche} + {city},
// then parse the results into lead rows.
//
// Why this works:
//   - Google has indexed millions of Facebook business pages
//   - Serper returns title + snippet + link — enough to extract business name,
//     phone (often in snippet), and Facebook URL
//   - Complementary to Google Places: some businesses live ONLY on Facebook
//   - Cheap: ~$0.003 per Serper query; up to 100 results per query
//
// Auth: admin session cookie (via requireAdmin).
//
// Body:
//   {
//     niche: string,      // e.g. "mobile mechanic"
//     city: string,       // e.g. "Dallas, TX"
//     limit?: number      // max leads to insert per city, default 30
//   }
//
// Response:
//   { ok, found, has_phone, has_no_external_site, inserted, skipped, sample }

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = { niche?: string; city?: string; limit?: number };

type SerperOrganic = {
  title: string;
  link: string;
  snippet?: string;
};

type FbLead = {
  fb_url: string;
  name: string;
  city: string;
  niche: string;
  phone: string | null;
  snippet: string | null;
};

// Facebook URLs shaped like /people/, /groups/, /events/, /posts/, /photo/, etc.
// are not business Pages — skip them.
const FB_NON_BUSINESS_PATH = /^https?:\/\/(?:www\.|m\.|business\.)?facebook\.com\/(?:people|groups|events|posts|photo|watch|marketplace|help|policies|settings|about|reg|home\.php|reels|stories)(?:\/|$|\?)/i;
const FB_BUSINESS_URL = /^https?:\/\/(?:www\.|m\.|business\.)?facebook\.com\/(?:pages\/|pg\/|business\/pages\/)?[^/?#]+(?:\/[^/?#]*)?/i;

// Extract a plausible US phone from the snippet. Handles a few common formats.
function extractPhone(text: string | null | undefined): string | null {
  if (!text) return null;
  // (713) 555-1234 | 713-555-1234 | 713.555.1234 | 7135551234 | +1 713 555 1234
  const m = text.match(
    /(?:\+?1[\s.-]?)?(?:\(?[2-9]\d{2}\)?[\s.-]?)[2-9]\d{2}[\s.-]?\d{4}/,
  );
  if (!m) return null;
  const digits = m[0].replace(/[^0-9]/g, "");
  const last10 = digits.length >= 11 ? digits.slice(-10) : digits;
  if (last10.length !== 10) return null;
  return `+1${last10}`;
}

// Turn a Facebook page title into a cleaner business name.
// Titles typically look like: "Alan's Mobile Mechanic | Facebook" or
//   "Alan's Mobile Mechanic - Home | Facebook"
function cleanBusinessName(title: string): string {
  let name = title
    .replace(/\s*\|\s*Facebook\s*$/i, "")
    .replace(/\s*[-–—]\s*Facebook\s*$/i, "")
    .replace(/\s*[-–—]\s*Home\s*$/i, "")
    .replace(/\s*[-–—]\s*Community\s*$/i, "")
    .trim();
  // Remove trailing " - Posts", " - About", etc.
  name = name.replace(/\s*[-–—]\s*(Posts|About|Reviews|Photos|Videos|Menu|Home)\s*$/i, "");
  return name.trim();
}

async function serperSearch(
  key: string,
  query: string,
  num: number,
): Promise<SerperOrganic[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { organic?: SerperOrganic[] };
  return data.organic ?? [];
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const niche = (body.niche ?? "").trim();
  const city = (body.city ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(body.limit) || 30));

  if (!niche || !city) {
    return NextResponse.json(
      { error: "niche and city are required" },
      { status: 400 },
    );
  }

  const serperKey = process.env.SERPER_API_KEY;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serperKey || !supaUrl || !supaKey) {
    return NextResponse.json(
      { error: "server not configured (SERPER_API_KEY / Supabase)" },
      { status: 500 },
    );
  }

  // Two queries: one aimed at Pages, one broader. Union results, dedupe by URL.
  // Both are one Serper call each (~$0.003) so cost stays under a cent per city.
  const q1 = `site:facebook.com "${niche}" "${city}"`;
  const q2 = `site:facebook.com/pages "${niche}" "${city}"`;

  const [r1, r2] = await Promise.all([
    serperSearch(serperKey, q1, 50),
    serperSearch(serperKey, q2, 50),
  ]);
  const merged = [...r1, ...r2];

  // Bucket by canonical FB URL, keep the first hit's title + snippet.
  const byUrl = new Map<string, FbLead>();
  for (const r of merged) {
    const link = r.link ?? "";
    if (!FB_BUSINESS_URL.test(link)) continue;
    if (FB_NON_BUSINESS_PATH.test(link)) continue;
    // Canonical: strip trailing slash, query, fragment
    const canonical = link.split("?")[0].split("#")[0].replace(/\/$/, "");
    if (byUrl.has(canonical)) continue;
    const name = cleanBusinessName(r.title ?? "");
    if (name.length < 2 || name.length > 100) continue;
    const phone = extractPhone(r.snippet) ?? extractPhone(r.title);
    byUrl.set(canonical, {
      fb_url: canonical,
      name,
      city,
      niche,
      phone,
      snippet: r.snippet ?? null,
    });
  }

  const found = byUrl.size;
  const withPhone = Array.from(byUrl.values()).filter((l) => l.phone).length;

  // Insert into leads with source='facebook_serper'.
  const supabase = createClient(supaUrl, supaKey, {
    auth: { persistSession: false },
  });

  const candidates = Array.from(byUrl.values()).slice(0, limit);
  const rows = candidates.map((c) => ({
    // Use fb_url as the deduplication key (place_id column).
    place_id: `fb:${c.fb_url.replace(/^https?:\/\/(?:www\.|m\.|business\.)?facebook\.com\//, "").slice(0, 100)}`,
    name: c.name,
    address: null,
    phone: c.phone,
    rating: null,
    rating_count: null,
    types: ["facebook_page"],
    niche: c.niche,
    city: c.city,
    has_website: false,
    website_url: c.fb_url,
    facebook_url: c.fb_url,
    source: "facebook_serper",
    enrichment_data: { serper_snippet: c.snippet },
  }));

  let inserted = 0;
  let skipped = 0;
  if (rows.length > 0) {
    const { data, error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "place_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      return NextResponse.json(
        { error: `supabase upsert: ${error.message}` },
        { status: 500 },
      );
    }
    inserted = data?.length ?? 0;
    skipped = rows.length - inserted;
  }

  return NextResponse.json({
    ok: true,
    query_1: q1,
    query_2: q2,
    found,
    with_phone: withPhone,
    inserted,
    skipped,
    sample: candidates.slice(0, 5).map((c) => ({
      name: c.name,
      phone: c.phone,
      fb_url: c.fb_url,
    })),
  });
}
