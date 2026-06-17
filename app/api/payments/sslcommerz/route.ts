import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/email";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Verify your email before checkout." }, { status: 403 });
  }

  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASS;
  const baseUrl = process.env.SSLCOMMERZ_BASE_URL || "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
  if (!storeId || !storePass) {
    return NextResponse.json({ error: "SSLCommerz is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || "");
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { listing: true, buyer: true }
  });
  if (!order || order.buyerId !== user.id || order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const form = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePass,
    total_amount: Number(order.agreedPrice).toFixed(2),
    currency: "BDT",
    tran_id: order.id,
    success_url: appUrl(`/api/payments/sslcommerz/success?orderId=${order.id}`),
    fail_url: appUrl(`/orders?payment=failed&order=${order.id}`),
    cancel_url: appUrl(`/orders?payment=cancelled&order=${order.id}`),
    cus_name: order.buyer.name,
    cus_email: order.buyer.email,
    cus_phone: order.buyer.phone || "01700000000",
    cus_add1: order.pickupPoint,
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: order.listing.title,
    product_category: order.listing.category,
    product_profile: "general"
  });

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form
  });
  const payload = await response.json();
  const gatewayUrl = payload.GatewayPageURL || payload.gatewayPageURL;
  if (!response.ok || !gatewayUrl) {
    return NextResponse.json({ error: payload.failedreason || "Could not start payment." }, { status: 502 });
  }

  return NextResponse.json({ gatewayUrl });
}
