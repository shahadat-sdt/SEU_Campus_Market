import { db } from "@/shared/lib/db";

export const categoryFollowRepository = {
  followersForCategory(category: string, excludingUserId: string) {
    return db.followedCategory.findMany({
      where: { category, userId: { not: excludingUserId } },
      select: { userId: true }
    });
  },

  follow(category: string, userId: string) {
    return db.followedCategory.upsert({
      where: { category_userId: { category, userId } },
      update: {},
      create: { category, userId }
    });
  }
};
