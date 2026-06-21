import "server-only";

import { sendTransactionalEmail } from "@/shared/lib/email";
import { notificationRepository, type NotificationCreateInput } from "@/features/notifications/repositories/notification-repository";

export interface NotificationStrategy<TPayload> {
  send(payload: TPayload): Promise<void>;
}

export class InAppNotificationStrategy implements NotificationStrategy<NotificationCreateInput> {
  async send(payload: NotificationCreateInput) {
    await notificationRepository.create(payload);
  }
}

export class BulkInAppNotificationStrategy implements NotificationStrategy<NotificationCreateInput[]> {
  async send(payload: NotificationCreateInput[]) {
    await notificationRepository.createMany(payload);
  }
}

export class EmailNotificationStrategy implements NotificationStrategy<{
  to: string;
  name: string;
  subject: string;
  html: string;
}> {
  async send(payload: { to: string; name: string; subject: string; html: string }) {
    await sendTransactionalEmail(payload);
  }
}
