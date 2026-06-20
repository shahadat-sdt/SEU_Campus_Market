export function listingReport(input: {
  listingId: string;
  userId: string;
  reason?: string;
}) {
  return {
    listingId: input.listingId,
    userId: input.userId,
    reason: input.reason || "Suspicious listing"
  };
}

export function commentReport(input: {
  commentId: string;
  listingId: string;
  userId: string;
  reason?: string;
}) {
  return {
    commentId: input.commentId,
    listingId: input.listingId,
    userId: input.userId,
    reason: input.reason || "Reported comment"
  };
}
