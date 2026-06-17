import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const orderId = String(form.get("tran_id") || form.get("orderId") || "");
  return markPaid(orderId);
}

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId") || "";
  return markPaid(orderId);
}

async function markPaid(orderId: string) {
  if (orderId) {
    await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" }
    }).catch(() => null);
  }

  return NextResponse.redirect(new URL(`/orders?payment=success&order=${orderId}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
