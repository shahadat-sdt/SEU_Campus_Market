import { db } from "@/shared/lib/db";

export const commentRepository = {
  findDuplicate(input: { listingId: string; userId: string; parentId?: string; body: string; since: Date }) {
    return db.comment.findFirst({
      where: {
        listingId: input.listingId,
        userId: input.userId,
        parentId: input.parentId || null,
        body: input.body,
        createdAt: { gte: input.since }
      },
      select: { id: true }
    });
  },

  create(input: { listingId: string; userId: string; parentId?: string; body: string }) {
    return db.comment.create({
      data: {
        listingId: input.listingId,
        userId: input.userId,
        parentId: input.parentId || null,
        body: input.body
      }
    });
  },

  delete(id: string) {
    return db.comment.delete({ where: { id } });
  }
};
