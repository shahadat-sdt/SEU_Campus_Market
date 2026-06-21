import "server-only";

import { DomainError } from "@/shared/lib/domain/errors";
import { dispatchDomainEvent } from "@/features/notifications/events/domain-event-bus";
import { listingRepository } from "@/features/listings/repositories/listing-repository";
import { orderRepository } from "@/features/orders/repositories/order-repository";
import { reviewRepository } from "@/features/orders/repositories/review-repository";
import {
  canBuyerCancelOrder,
  canBuyerReviewOrder,
  canPlaceOrder,
  canSellerManageOrder,
  isValidOrderStatus,
  isValidPickupPoint
} from "@/features/orders/specifications/order-specification";

export const orderService = {
  async placeOrder(input: {
    buyerId: string;
    listingId: string;
    quantity: number;
    pickupPoint: string;
    note?: string;
  }) {
    if (!isValidPickupPoint(input.pickupPoint)) {
      throw new DomainError("Invalid pickup point.", "INVALID_PICKUP_POINT");
    }

    const listing = await listingRepository.findForOrder(input.listingId);
    if (!listing) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");
    if (!canPlaceOrder({ buyerId: input.buyerId, listing, quantity: input.quantity })) {
      throw new DomainError("Listing is unavailable.", "LISTING_UNAVAILABLE");
    }

    const order = await orderRepository.create({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: listing.sellerId,
      quantity: input.quantity,
      agreedPrice: Number(listing.price) * input.quantity,
      pickupPoint: input.pickupPoint,
      note: input.note
    });

    await dispatchDomainEvent({
      type: "order.placed",
      sellerId: listing.sellerId,
      listingId: listing.id,
      listingTitle: listing.title,
      orderId: order.id
    });

    return order;
  },

  async cancelOrder(input: { userId: string; buyerName: string; orderId: string; reason: string }) {
    const order = await orderRepository.findWithListing(input.orderId);
    if (!order || !canBuyerCancelOrder(input.userId, order)) {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    await orderRepository.updateStatus(order.id, "CANCELLED", input.reason);
    await dispatchDomainEvent({
      type: "order.cancelled",
      sellerId: order.sellerId,
      buyerName: input.buyerName,
      listingId: order.listingId,
      listingTitle: order.listing.title,
      orderId: order.id,
      reason: input.reason
    });
  },

  async addPaymentNote(input: { userId: string; buyerName: string; orderId: string; paymentNote: string }) {
    if (!input.paymentNote) throw new DomainError("Payment note is required.", "PAYMENT_NOTE_REQUIRED");

    const order = await orderRepository.findWithListing(input.orderId);
    if (!order || order.buyerId !== input.userId || order.status === "CANCELLED") {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    await orderRepository.updatePaymentNote(order.id, input.paymentNote);
    await dispatchDomainEvent({
      type: "payment.note.added",
      sellerId: order.sellerId,
      buyerName: input.buyerName,
      listingId: order.listingId,
      listingTitle: order.listing.title,
      orderId: order.id
    });
  },

  async updateOrder(input: {
    sellerId: string;
    sellerName: string;
    orderId: string;
    status: string;
    statusNote?: string;
  }) {
    if (!isValidOrderStatus(input.status)) throw new DomainError("Invalid order status.", "INVALID_ORDER_STATUS");

    const order = await orderRepository.findWithBuyerAndListing(input.orderId);
    if (!order || !canSellerManageOrder(input.sellerId, order)) {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    const statusNote = input.status === "CANCELLED" ? input.statusNote || "Cancelled by seller" : input.statusNote || null;
    await orderRepository.updateStatus(order.id, input.status, statusNote);
    if (input.status === "COMPLETED") {
      await listingRepository.setStatus(order.listingId, "SOLD");
    }

    await dispatchDomainEvent({
      type: "order.status.changed",
      buyerId: order.buyerId,
      buyerEmail: order.buyer.email,
      buyerName: order.buyer.name,
      sellerName: input.sellerName,
      listingId: order.listingId,
      listingTitle: order.listing.title,
      orderId: order.id,
      status: input.status,
      statusNote
    });
  },

  async markPaymentPaidBySeller(input: { sellerId: string; orderId: string }) {
    const order = await orderRepository.findWithListing(input.orderId);
    if (!order || !canSellerManageOrder(input.sellerId, order)) {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    await orderRepository.updatePaymentStatus(order.id, "PAID");
    await dispatchDomainEvent({
      type: "payment.marked.paid",
      buyerId: order.buyerId,
      listingId: order.listingId,
      listingTitle: order.listing.title,
      orderId: order.id
    });
  },

  async markPaymentPaidByGateway(orderId: string) {
    const order = await orderRepository.findWithListing(orderId);
    if (!order || order.status === "CANCELLED") throw new DomainError("Order not found.", "ORDER_NOT_FOUND");

    await orderRepository.updatePaymentStatus(order.id, "PAID");
    await dispatchDomainEvent({
      type: "payment.marked.paid",
      buyerId: order.buyerId,
      listingId: order.listingId,
      listingTitle: order.listing.title,
      orderId: order.id
    });
  },

  async createReview(input: { userId: string; orderId: string; rating: number; comment: string }) {
    const order = await orderRepository.findById(input.orderId);
    if (!order || !canBuyerReviewOrder(input.userId, order)) {
      throw new DomainError("Order not found.", "ORDER_NOT_FOUND");
    }

    return reviewRepository.create({
      orderId: input.orderId,
      buyerId: input.userId,
      sellerId: order.sellerId,
      rating: input.rating,
      comment: input.comment
    });
  }
};
