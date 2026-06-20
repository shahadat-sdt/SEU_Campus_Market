import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const orderRepository = {
  create(input: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    quantity: number;
    agreedPrice: number;
    pickupPoint: string;
    note?: string;
  }) {
    return db.order.create({ data: input });
  },

  findById(id: string) {
    return db.order.findUnique({ where: { id } });
  },

  findWithListing(id: string) {
    return db.order.findUnique({ where: { id }, include: { listing: true } });
  },

  findWithBuyerAndListing(id: string) {
    return db.order.findUnique({
      where: { id },
      include: { buyer: true, listing: true }
    });
  },

  updateStatus(id: string, status: OrderStatus, statusNote?: string | null) {
    return db.order.update({ where: { id }, data: { status, statusNote } });
  },

  updatePaymentNote(id: string, paymentNote: string) {
    return db.order.update({ where: { id }, data: { paymentNote } });
  },

  updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return db.order.update({ where: { id }, data: { paymentStatus } });
  }
};
