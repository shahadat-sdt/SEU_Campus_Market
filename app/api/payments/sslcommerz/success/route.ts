import { NextResponse } from "next/server";
import { paymentService } from "@/features/payments/services/payment-service";

export async function POST(request: Request) {
  const form = await request.formData();
  const orderId = String(form.get("tran_id") || form.get("orderId") || "");
  const validationId = String(form.get("val_id") || "");
  return markPaid(orderId, validationId);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const orderId = params.get("tran_id") || params.get("orderId") || "";
  const validationId = params.get("val_id") || "";
  return markPaid(orderId, validationId);
}

async function markPaid(orderId: string, validationId: string) {
  const ok = orderId ? await paymentService.validateAndMarkPaid({ orderId, validationId }).catch(() => false) : false;
  const paymentState = ok ? "success" : "validation_failed";

  return NextResponse.redirect(new URL(`/orders?payment=${paymentState}&order=${orderId}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
