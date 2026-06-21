import "server-only";

import type { DomainEvent } from "@/features/notifications/events/domain-events";
import {
  categoryFollowerNotification,
  listingCommentNotification,
  orderCancelledNotification,
  orderStatusNotification,
  paymentConfirmedNotification,
  paymentNoteNotification,
  sellerOrderRequestNotification
} from "@/features/notifications/factories/notification-factory";
import { notificationService } from "@/features/notifications/services/notification-service";

export async function dispatchDomainEvent(event: DomainEvent) {
  switch (event.type) {
    case "listing.published":
      await notificationService.sendManyInApp(
        event.followerIds.map((userId) =>
          categoryFollowerNotification({
            userId,
            category: event.category,
            title: event.listingTitle,
            listingId: event.listingId,
            listingCode: event.listingCode
          })
        )
      );
      break;
    case "order.placed":
      await notificationService.sendInApp(sellerOrderRequestNotification(event));
      break;
    case "order.cancelled":
      await notificationService.sendInApp(orderCancelledNotification(event));
      break;
    case "payment.note.added":
      await notificationService.sendInApp(paymentNoteNotification(event));
      break;
    case "order.status.changed":
      await Promise.all([
        notificationService.sendInApp(orderStatusNotification(event)),
        notificationService.sendEmail({
          to: event.buyerEmail,
          name: event.buyerName,
          subject: `Order update: ${event.listingTitle}`,
          html: `<p>Your order for <strong>${event.listingTitle}</strong> is now ${event.status.toLowerCase()}.</p>${event.statusNote ? `<p>${event.statusNote}</p>` : ""}`
        })
      ]);
      break;
    case "payment.marked.paid":
      await notificationService.sendInApp(paymentConfirmedNotification(event));
      break;
    case "comment.created":
      if (event.sellerId !== event.commenterId) {
        await notificationService.sendInApp(listingCommentNotification(event));
      }
      break;
  }
}
