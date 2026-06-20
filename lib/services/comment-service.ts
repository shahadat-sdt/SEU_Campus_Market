import "server-only";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/domain/errors";
import { dispatchDomainEvent } from "@/lib/events/domain-event-bus";

export const commentService = {
  async create(input: { userId: string; userName: string; listingId: string; parentId?: string; body: string }) {
    if (!input.body || input.body.length > 500) {
      throw new DomainError("Comment is invalid.", "INVALID_COMMENT");
    }

    const listing = await db.listing.findUnique({ where: { id: input.listingId } });
    if (!listing) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");

    const duplicate = await db.comment.findFirst({
      where: {
        listingId: input.listingId,
        userId: input.userId,
        parentId: input.parentId || null,
        body: input.body,
        createdAt: { gte: new Date(Date.now() - 8000) }
      },
      select: { id: true }
    });
    if (duplicate) return;

    await db.comment.create({
      data: {
        listingId: input.listingId,
        userId: input.userId,
        parentId: input.parentId || null,
        body: input.body
      }
    });

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
