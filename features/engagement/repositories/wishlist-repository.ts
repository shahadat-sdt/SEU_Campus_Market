import { db } from "@/shared/lib/db";

export const wishlistRepository = {
  findByListingAndUser(listingId: string, userId: string) {
    return db.wishlistItem.findUnique({ where: { listingId_userId: { listingId, userId } } });
  },

  create(listingId: string, userId: string) {
    return db.wishlistItem.create({ data: { listingId, userId } });
  },

  delete(id: string) {
    return db.wishlistItem.delete({ where: { id } });
  }
};
