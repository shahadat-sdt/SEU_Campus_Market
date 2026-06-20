import type { Listing, Order, OrderStatus } from "@prisma/client";
import { meetupPoints, orderStatuses } from "@/lib/constants";

export function isValidPickupPoint(pickupPoint: string) {
  return meetupPoints.includes(pickupPoint as never);
}

export function isValidOrderStatus(status: string): status is OrderStatus {
  return orderStatuses.includes(status as never);
}

export function availableListingQuantity(listing: Pick<Listing, "quantity"> & { orders: Array<Pick<Order, "quantity">> }) {
  const reserved = listing.orders.reduce((sum, order) => sum + order.quantity, 0);
  return Math.max(0, listing.quantity - reserved);
}

export function canPlaceOrder(input: {
  buyerId: string;
  listing: Pick<Listing, "sellerId" | "status" | "quantity"> & { orders: Array<Pick<Order, "quantity">> };
  quantity: number;
}) {
  return (
    input.listing.sellerId !== input.buyerId &&
    input.listing.status === "ACTIVE" &&
    input.quantity > 0 &&
    input.quantity <= availableListingQuantity(input.listing)
  );
}

export function canBuyerCancelOrder(userId: string, order: Pick<Order, "buyerId" | "status"> | null) {
  return Boolean(order && order.buyerId === userId && order.status === "PENDING");
}

export function canSellerManageOrder(userId: string, order: Pick<Order, "sellerId"> | null) {
  return Boolean(order && order.sellerId === userId);
}

export function canBuyerReviewOrder(userId: string, order: Pick<Order, "buyerId" | "status"> | null) {
  return Boolean(order && order.buyerId === userId && order.status === "COMPLETED");
}
