import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DomainError } from "@/lib/domain/errors";
import { paymentService } from "@/lib/services/payment-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Verify your email before checkout." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || "");

  try {
    const gatewayUrl = await paymentService.startCheckout({ userId: user.id, orderId });
    return NextResponse.json({ gatewayUrl });
  } catch (error) {
    if (error instanceof DomainError && error.code === "SSLCOMMERZ_NOT_CONFIGURED") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof DomainError && error.code === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start payment." }, { status: 502 });
  }
}
