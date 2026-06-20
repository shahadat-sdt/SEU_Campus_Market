import "server-only";

import { sslCommerzAdapter } from "@/lib/adapters/sslcommerz-adapter";

export interface PaymentStrategy {
  startCheckout(input: {
    orderId: string;
    amount: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    pickupPoint: string;
    productName: string;
    productCategory: string;
  }): Promise<string>;
  validateCallback(input: { validationId: string; orderId: string; amount: number }): Promise<boolean>;
}

export class SSLCommerzPaymentStrategy implements PaymentStrategy {
  startCheckout(input: {
    orderId: string;
    amount: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    pickupPoint: string;
    productName: string;
    productCategory: string;
  }) {
    return sslCommerzAdapter.createGatewaySession(input);
  }

  validateCallback(input: { validationId: string; orderId: string; amount: number }) {
    return sslCommerzAdapter.validatePayment(input);
  }
}
