import { db } from "@/shared/lib/db";

export const reviewRepository = {
  create(input: { orderId: string; buyerId: string; sellerId: string; rating: number; comment: string }) {
    return db.review.create({ data: input });
  }
};
