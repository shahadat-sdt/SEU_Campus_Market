function productUrl(listingId: string) {
  return `/listings/${listingId}`;
}

export function orderUrl(orderId?: string) {
  return orderId ? `/orders?order=${orderId}` : "/orders";
}

export function categoryFollowerNotification(input: {
  userId: string;
  category: string;
  title: string;
  listingId: string;
  listingCode: string;
}) {
  return {
    userId: input.userId,
    title: `New ${input.category} listing`,
    body: `${input.title} is now available on campus. Code: ${input.listingCode}`,
    productId: input.listingId,
    productTitle: input.title,
    url: productUrl(input.listingId)
  };
}

export function sellerOrderRequestNotification(input: {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
}) {
  return {
    userId: input.sellerId,
    title: "New order request",
    body: `New order for '${input.listingTitle}' - View order ${input.orderId.slice(-6).toUpperCase()}`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    orderId: input.orderId,
    url: orderUrl(input.orderId)
  };
}

export function orderCancelledNotification(input: {
  sellerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
  reason: string;
}) {
  return {
    userId: input.sellerId,
    title: "Order cancelled",
    body: `${input.buyerName} cancelled the request for ${input.listingTitle}. Reason: ${input.reason}`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    orderId: input.orderId,
    url: orderUrl(input.orderId)
  };
}

export function paymentNoteNotification(input: {
  sellerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
}) {
  return {
    userId: input.sellerId,
    title: "Payment note submitted",
    body: `${input.buyerName} added a payment reference for ${input.listingTitle}.`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    orderId: input.orderId,
    url: orderUrl(input.orderId)
  };
}

export function orderStatusNotification(input: {
  buyerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
  status: string;
  statusNote?: string | null;
}) {
  return {
    userId: input.buyerId,
    title: `Order ${input.status.toLowerCase()}`,
    body: `${input.listingTitle} is now ${input.status.toLowerCase()} by ${input.sellerName}.${input.statusNote ? ` Note: ${input.statusNote}` : ""}`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    orderId: input.orderId,
    url: orderUrl(input.orderId)
  };
}

export function paymentConfirmedNotification(input: {
  buyerId: string;
  listingId: string;
  listingTitle: string;
  orderId: string;
}) {
  return {
    userId: input.buyerId,
    title: "Payment confirmed",
    body: `Payment for ${input.listingTitle} has been confirmed.`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    orderId: input.orderId,
    url: orderUrl(input.orderId)
  };
}

export function listingCommentNotification(input: {
  sellerId: string;
  commenterName: string;
  listingId: string;
  listingTitle: string;
}) {
  return {
    userId: input.sellerId,
    title: "New product comment",
    body: `${input.commenterName} commented on '${input.listingTitle}'.`,
    productId: input.listingId,
    productTitle: input.listingTitle,
    url: productUrl(input.listingId)
  };
}
