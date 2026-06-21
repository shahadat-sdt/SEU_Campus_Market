import "server-only";

import type { VoteType } from "@prisma/client";
import { DomainError } from "@/shared/lib/domain/errors";
import { voteRepository } from "@/features/engagement/repositories/vote-repository";
import { wishlistRepository } from "@/features/engagement/repositories/wishlist-repository";

export const engagementService = {
  async toggleVote(input: { userId: string; listingId: string; voteType: VoteType }) {
    if (input.voteType !== "LIKE" && input.voteType !== "DISLIKE") {
      throw new DomainError("Vote type is invalid.", "INVALID_VOTE");
    }

    const existing = await voteRepository.findByListingAndUser(input.listingId, input.userId);
    if (existing?.voteType === input.voteType) {
      await voteRepository.delete(existing.id);
      return;
    }

    await voteRepository.upsert(input.listingId, input.userId, input.voteType);
  },

  async toggleWishlist(input: { userId: string; listingId: string }) {
    if (!input.listingId) throw new DomainError("Listing is required.", "LISTING_REQUIRED");

    const existing = await wishlistRepository.findByListingAndUser(input.listingId, input.userId);
    if (existing) {
      await wishlistRepository.delete(existing.id);
      return;
    }

    await wishlistRepository.create(input.listingId, input.userId);
  }
};
