import "server-only";

import { appUrl } from "@/shared/lib/email";
import { DomainError } from "@/shared/lib/domain/errors";
import { withRetry, withTimeout } from "@/shared/lib/decorators/fetch-decorators";

const resilientFetch = withRetry(withTimeout(fetch, 12_000), 2);

function config() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePass = process.env.SSLCOMMERZ_STORE_PASS;
  const baseUrl = process.env.SSLCOMMERZ_BASE_URL || "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
  const validationUrl =
    process.env.SSLCOMMERZ_VALIDATION_URL ||
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

  if (!storeId || !storePass) {
    throw new DomainError("SSLCommerz is not configured.", "SSLCOMMERZ_NOT_CONFIGURED");
  }

  return { storeId, storePass, baseUrl, validationUrl };
}

export const sslCommerzAdapter = {
  async createGatewaySession(input: {
    orderId: string;
    amount: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    pickupPoint: string;
    productName: string;
    productCategory: string;
  }) {
    const { storeId, storePass, baseUrl } = config();
    const form = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePass,
      total_amount: input.amount.toFixed(2),
      currency: "BDT",
      tran_id: input.orderId,
      success_url: appUrl("/api/payments/sslcommerz/success"),
      fail_url: appUrl(`/orders?payment=failed&order=${input.orderId}`),
      cancel_url: appUrl(`/orders?payment=cancelled&order=${input.orderId}`),
      cus_name: input.buyerName,
      cus_email: input.buyerEmail,
      cus_phone: input.buyerPhone || "01700000000",
      cus_add1: input.pickupPoint,
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      product_name: input.productName,
      product_category: input.productCategory,
      product_profile: "general"
    });

    const response = await resilientFetch(baseUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form
    });
    const payload = await response.json();
    const gatewayUrl = payload.GatewayPageURL || payload.gatewayPageURL;
    if (!response.ok || !gatewayUrl) {
      throw new DomainError(payload.failedreason || "Could not start payment.", "PAYMENT_START_FAILED");
    }

    return String(gatewayUrl);
  },

  async validatePayment(input: { validationId: string; orderId: string; amount: number }) {
    const { storeId, storePass, validationUrl } = config();
    if (!input.validationId) return false;

    const params = new URLSearchParams({
      val_id: input.validationId,
      store_id: storeId,
      store_passwd: storePass,
      format: "json"
    });

    const response = await resilientFetch(`${validationUrl}?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) return false;

    const status = String(payload.status || "").toUpperCase();
    const transactionId = String(payload.tran_id || "");
    const amount = Number(payload.amount);

    return (
      (status === "VALID" || status === "VALIDATED") &&
      transactionId === input.orderId &&
      Number.isFinite(amount) &&
      Math.abs(amount - input.amount) < 0.01
    );
  }
};
