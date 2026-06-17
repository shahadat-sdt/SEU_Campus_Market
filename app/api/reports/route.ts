import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId || "");
  const reporterId = String(body?.reporterId || "");
  const reason = String(body?.reason || "Suspicious listing").trim();

  if (!productId || reporterId !== user.id || !reason) {
    return NextResponse.json({ error: "productId, reporterId, reason, and timestamp are required." }, { status: 400 });
  }

  await db.report.create({
    data: {
      listingId: productId,
      userId: user.id,
      reason
    }
  });

  return NextResponse.json({
    ok: true,
    message: "Report submitted. We'll review it shortly.",
    timestamp: body?.timestamp || new Date().toISOString()
  });
}
