import "server-only";

import {
  BulkInAppNotificationStrategy,
  EmailNotificationStrategy,
  InAppNotificationStrategy
} from "@/lib/strategies/notification-strategy";
import type { NotificationCreateInput } from "@/lib/repositories/notification-repository";
import { notificationRepository } from "@/lib/repositories/notification-repository";

const inApp = new InAppNotificationStrategy();
const bulkInApp = new BulkInAppNotificationStrategy();
const email = new EmailNotificationStrategy();

export const notificationService = {
  sendInApp(notification: NotificationCreateInput) {
    return inApp.send(notification);
  },

  sendManyInApp(notifications: NotificationCreateInput[]) {
    return bulkInApp.send(notifications);
  },

  sendEmail(message: { to: string; name: string; subject: string; html: string }) {
    return email.send(message);
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },

  markOneRead(notificationId: string, userId: string) {
    return notificationRepository.markOneRead(notificationId, userId);
  }
};
