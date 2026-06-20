import type { ListingStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type ListingCreateInput = {
  title: string;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  negotiable: boolean;
  campusPickup: boolean;
  whatsappContact: boolean;
  deliveryAvailable: boolean;
  status: ListingStatus;
  price: number;
  code: string;
  sellerId: string;
};

export type ListingUpdateInput = Omit<ListingCreateInput, "code" | "sellerId" | "status">;

export const listingRepository = {
  findById(id: string) {
    return db.listing.findUnique({ where: { id } });
  },

  findForOrder(id: string) {
    return db.listing.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { quantity: true }
        }
      }
    });
  },

  findForDelete(id: string) {
    return db.listing.findUnique({
      where: { id },
      include: { orders: { select: { id: true } } }
    });
  },

  findDuplicate(input: {
    sellerId: string;
    title: string;
    description: string;
    category: string;
    price: number;
    since: Date;
  }) {
    return db.listing.findFirst({
      where: {
        sellerId: input.sellerId,
        title: input.title,
        description: input.description,
        category: input.category,
        price: input.price,
        createdAt: { gte: input.since }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  create(data: ListingCreateInput) {
    return db.listing.create({ data });
  },

  update(id: string, data: ListingUpdateInput) {
    return db.listing.update({ where: { id }, data });
  },

  setStatus(id: string, status: ListingStatus) {
    return db.listing.update({ where: { id }, data: { status } });
  },

  setSponsored(id: string, sponsored: boolean) {
    return db.listing.update({ where: { id }, data: { sponsored } });
  },

  delete(id: string) {
    return db.listing.delete({ where: { id } });
  },

  count(where?: Prisma.ListingWhereInput) {
    return db.listing.count({ where });
  }
};
