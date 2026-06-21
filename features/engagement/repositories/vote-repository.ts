import type { VoteType } from "@prisma/client";
import { db } from "@/shared/lib/db";

export const voteRepository = {
  findByListingAndUser(listingId: string, userId: string) {
    return db.vote.findUnique({ where: { listingId_userId: { listingId, userId } } });
  },

  delete(id: string) {
    return db.vote.delete({ where: { id } });
  },

  upsert(listingId: string, userId: string, voteType: VoteType) {
    return db.vote.upsert({
      where: { listingId_userId: { listingId, userId } },
      update: { voteType },
      create: { listingId, userId, voteType }
    });
  }
};
