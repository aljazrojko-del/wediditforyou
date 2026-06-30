// GET /api/admin/sms-quick/thread?phone=+17135551234 → merged in/out messages.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/outreach";
import { getThread } from "@/lib/sms-quick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const url = new URL(req.url);
  const phone = url.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 });

  const supabase = getServiceClient();
  const data = await getThread(supabase, phone);
  return NextResponse.json(data);
}
