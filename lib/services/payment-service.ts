import "server-only";

import { DomainError } from "@/lib/domain/errors";
import { orderRepository } from "@/lib/repositories/order-repository";
import { SSLCommerzPaymentStrategy } from "@/lib/strategies/payment-strategy";
import { orderService } from "@/lib/services/order-service";

const paymentStrategy = new SSLCommerzPaymentStrategy();

export const paymentService = {
  async startCheckout(input: { userId: string; orderId: string }) {
    const order = await orderRepository.findWithBuyerAndListing(input.orderId);
    if (!order || order.buyerId !== input.userId || order.status === "CANCELLED") {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    return paymentStrategy.startCheckout({
      orderId: order.id,
      amount: Number(order.agreedPrice),
      buyerName: order.buyer.name,
      buyerEmail: order.buyer.email,
      buyerPhone: order.buyer.phone,
      pickupPoint: order.pickupPoint,
      productName: order.listing.title,
      productCategory: order.listing.category
    });
  },

  async validateAndMarkPaid(input: { validationId: string; orderId: string }) {
    const order = await orderRepository.findById(input.orderId);
    if (!order) return false;

    const isValid = await paymentStrategy.validateCallback({
      validationId: input.validationId,
      orderId: order.id,
      amount: Number(order.agreedPrice)
    });
    if (!isValid) return false;

    await orderService.markPaymentPaidByGateway(order.id);
    return true;
  }
};
