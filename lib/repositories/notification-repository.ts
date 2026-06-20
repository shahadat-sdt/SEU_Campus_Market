import { db } from "@/lib/db";

export type NotificationCreateInput = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
};

export const notificationRepository = {
  create(data: NotificationCreateInput) {
    return db.notification.create({ data });
  },

  createMany(data: NotificationCreateInput[]) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return db.notification.createMany({ data });
  },

  markAllRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  },

  markOneRead(id: string, userId: string) {
    return db.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
  }
};
