import "server-only";

import { DomainError } from "@/shared/lib/domain/errors";
import { dispatchDomainEvent } from "@/features/notifications/events/domain-event-bus";
import { commentRepository } from "@/features/comments/repositories/comment-repository";
import { listingRepository } from "@/features/listings/repositories/listing-repository";

export const commentService = {
  async create(input: { userId: string; userName: string; listingId: string; parentId?: string; body: string }) {
    if (!input.body || input.body.length > 500) {
      throw new DomainError("Comment is invalid.", "INVALID_COMMENT");
    }

    const listing = await listingRepository.findById(input.listingId);
    if (!listing) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");

    const duplicate = await commentRepository.findDuplicate({
      listingId: input.listingId,
      userId: input.userId,
      parentId: input.parentId,
      body: input.body,
      since: new Date(Date.now() - 8000)
    });
    if (duplicate) return;

    await commentRepository.create(input);

    await dispatchDomainEvent({
      type: "comment.created",
      sellerId: listing.sellerId,
      commenterId: input.userId,
      commenterName: input.userName,
      listingId: listing.id,
      listingTitle: listing.title
    });
  }
};
