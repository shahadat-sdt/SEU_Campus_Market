export type ListingPublishedEvent = {
  type: "listing.published";
  category: string;
  listingId: string;
  listingCode: string;
  listingTitle: string;
  followerIds: string[];
};

export type OrderPlacedEvent = {
  type: "order.placed";
  sellerId: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
};

export type OrderCancelledEvent = {
  type: "order.cancelled";
  sellerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
  reason: string;
};

export type PaymentNoteAddedEvent = {
  type: "payment.note.added";
  sellerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
};

export type OrderStatusChangedEvent = {
  type: "order.status.changed";
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
  status: string;
  statusNote?: string | null;
};

export type PaymentMarkedPaidEvent = {
  type: "payment.marked.paid";
  buyerId: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
};

export type CommentCreatedEvent = {
  type: "comment.created";
  sellerId: string;
  commenterId: string;
  commenterName: string;
  listingId: string;
  listingTitle: string;
};

export type DomainEvent =
  | ListingPublishedEvent
  | OrderPlacedEvent
  | OrderCancelledEvent
  | PaymentNoteAddedEvent
  | OrderStatusChangedEvent
  | PaymentMarkedPaidEvent
  | CommentCreatedEvent;
