// GET /api/admin/sms-quick/senders → which regional numbers exist + which
// are A2P-approved. Drives the sender dropdown in /admin/sms.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listSenders } from "@/lib/sms-quick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  return NextResponse.json({ senders: listSenders() });
}
