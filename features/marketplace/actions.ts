"use server";

import { ListingStatus, OrderStatus, UserRole, VoteType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireAdmin, requireUser, setSession } from "@/features/auth/server/auth";
import { listingCategories, listingStatuses } from "@/shared/lib/constants";
import { adminCommands } from "@/features/admin/commands/admin-commands";
import { DomainError } from "@/shared/lib/domain/errors";
import { authService } from "@/features/auth/services/auth-service";
import { commentService } from "@/features/comments/services/comment-service";
import { engagementService } from "@/features/engagement/services/engagement-service";
import { listingService } from "@/features/listings/services/listing-service";
import { notificationService } from "@/features/notifications/services/notification-service";
import { orderService } from "@/features/orders/services/order-service";
import { profileService } from "@/features/profile/services/profile-service";
import { reportService } from "@/features/reports/services/report-service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function isHttpsUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseJsonArray(input: string) {
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function safeReturn(path: string, fallback: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function register(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  let userId = "";

  try {
    const user = await authService.register({ name, email, password });
    userId = user.id;
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_EMAIL") {
      redirect("/register?error=email");
    }
    if (error instanceof DomainError && error.code === "USER_EXISTS") {
      redirect("/register?error=exists");
    }
    redirect("/register?error=missing");
  }

  await setSession(userId);
  redirect("/");
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  let userId = "";
  try {
    const user = await authService.authenticate({ email, password });
    userId = user.id;
  } catch {
    redirect("/login?error=invalid");
  }

  await setSession(userId);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function createListing(formData: FormData) {
  const user = await requireUser();
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const condition = value(formData, "condition") || "Good";
  const imageUrls = parseJsonArray(value(formData, "imageUrls")).filter(isHttpsUrl).slice(0, 4);
  const imageUrl = imageUrls[0] || "";
  const tags = parseJsonArray(value(formData, "tags")).slice(0, 5);
  const price = Number(value(formData, "price"));
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const intent = value(formData, "intent");
  const negotiable = value(formData, "negotiable") === "true";
  const campusPickup = value(formData, "campusPickup") === "on";
  const whatsappContact = value(formData, "whatsappContact") === "on";
  const deliveryAvailable = value(formData, "deliveryAvailable") === "on";
  const status: ListingStatus = intent === "draft" ? "DRAFT" : "ACTIVE";

  let listingId = "";
  try {
    const listing = await listingService.create({
      userId: user.id,
      status,
      payload: {
        title,
        description,
        category,
        condition,
        quantity,
        imageUrl,
        imageUrls,
        tags,
        negotiable,
        campusPickup,
        whatsappContact,
        deliveryAvailable,
        price
      }
    });
    listingId = listing.id;
  } catch (error) {
    if (error instanceof DomainError && error.code === "DUPLICATE_LISTING") {
      redirect(`/listings/${error.message}?duplicate=1`);
    }
    if (error instanceof DomainError && error.code === "LISTING_PHOTO_REQUIRED") {
      redirect("/listings/new?error=photo");
    }
    redirect("/listings/new?error=missing");
  }

  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath("/sell");
  redirect(`/listings/${listingId}`);
}

export async function updateListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const condition = value(formData, "condition") || "Good";
  const imageUrls = parseJsonArray(value(formData, "imageUrls")).filter(isHttpsUrl).slice(0, 4);
  const imageUrl = imageUrls[0] || "";
  const tags = parseJsonArray(value(formData, "tags")).slice(0, 5);
  const price = Number(value(formData, "price"));
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const negotiable = value(formData, "negotiable") === "true";
  const campusPickup = value(formData, "campusPickup") === "on";
  const whatsappContact = value(formData, "whatsappContact") === "on";
  const deliveryAvailable = value(formData, "deliveryAvailable") === "on";

  try {
    await listingService.update({
      userId: user.id,
      listingId,
      payload: {
        title,
        description,
        category,
        condition,
        quantity,
        imageUrl,
        imageUrls,
        tags,
        negotiable,
        campusPickup,
        whatsappContact,
        deliveryAvailable,
        price
      }
    });
  } catch (error) {
    if (error instanceof DomainError && error.code === "LISTING_PHOTO_REQUIRED") {
      redirect(`/listings/${listingId}/edit?error=photo`);
    }
    redirect(`/listings/${listingId}/edit?error=missing`);
  }

  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath("/sell");
  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}`);
}

export async function updateListingStatus(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const status = value(formData, "status") as ListingStatus;
  const returnTo = value(formData, "returnTo");
  try {
    await listingService.updateStatus(user.id, listingId, status);
  } catch (error) {
    if (error instanceof DomainError && error.code === "LISTING_PHOTO_REQUIRED") {
      redirect(`/listings/${listingId}/edit?error=photo`);
    }
    redirect(safeReturn(returnTo, "/sell"));
  }

  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath("/sell");
  revalidatePath(`/listings/${listingId}`);
  redirect(safeReturn(returnTo, "/sell"));
}

export async function deleteListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  try {
    await listingService.deleteOrArchive(user.id, listingId);
  } catch {
    redirect("/sell");
  }

  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath("/sell");
  redirect("/sell");
}

export async function followCategory(formData: FormData) {
  const user = await requireUser();
  const category = value(formData, "category");
  if (!listingCategories.includes(category as never)) redirect("/buy");

  await listingService.followCategory(user.id, category);
  revalidatePath("/buy");
  redirect(`/buy?category=${encodeURIComponent(category)}`);
}

export async function placeOrder(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const pickupPoint = value(formData, "pickupPoint");
  const note = value(formData, "note");

  let orderId = "";
  try {
    const order = await orderService.placeOrder({
      buyerId: user.id,
      listingId,
      quantity,
      pickupPoint,
      note
    });
    orderId = order.id;
  } catch {
    redirect(`/listings/${listingId}?error=stock`);
  }

  revalidatePath("/orders");
  redirect(`/orders?created=${orderId}`);
}

export async function cancelOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const reason = value(formData, "reason") || "Cancelled by buyer";

  try {
    await orderService.cancelOrder({ userId: user.id, buyerName: user.name, orderId, reason });
  } catch {
    redirect("/orders");
  }

  revalidatePath("/orders");
  revalidatePath("/sell");
}

export async function addPaymentNote(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const paymentNote = value(formData, "paymentNote");
  if (!paymentNote) redirect("/orders");

  try {
    await orderService.addPaymentNote({ userId: user.id, buyerName: user.name, orderId, paymentNote });
  } catch {
    redirect("/orders");
  }
  revalidatePath("/orders");
}

export async function updateOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const status = value(formData, "status") as OrderStatus;
  const statusNote = value(formData, "statusNote");
  try {
    await orderService.updateOrder({
      sellerId: user.id,
      sellerName: user.name,
      orderId,
      status,
      statusNote
    });
  } catch {
    redirect("/orders");
  }

  revalidatePath("/orders");
  revalidatePath("/sell");
}

export async function markPaymentReceived(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  try {
    await orderService.markPaymentPaidBySeller({ sellerId: user.id, orderId });
  } catch {
    redirect("/orders");
  }
  revalidatePath("/orders");
  revalidatePath("/sell");
}

export async function createReview(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const rating = Math.min(5, Math.max(1, Number(value(formData, "rating")) || 5));
  const comment = value(formData, "comment");

  let sellerId = "";
  try {
    const review = await orderService.createReview({ userId: user.id, orderId, rating, comment });
    sellerId = review.sellerId;
  } catch {
    redirect("/orders");
  }
  revalidatePath("/orders");
  revalidatePath(`/profile/${sellerId}`);
}

export async function reportListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const reason = value(formData, "reason") || "Suspicious listing";
  await reportService.createListingReport({ listingId, userId: user.id, reason });
  revalidatePath(`/listings/${listingId}`);
}

export async function reportComment(formData: FormData) {
  const user = await requireUser();
  const commentId = value(formData, "commentId");
  const listingId = value(formData, "listingId");
  const reason = value(formData, "reason") || "Reported comment";
  await reportService.createCommentReport({ commentId, listingId, userId: user.id, reason });
  revalidatePath(`/listings/${listingId}`);
}

export async function createComment(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const parentId = value(formData, "parentId");
  const body = value(formData, "body");
  try {
    await commentService.create({ userId: user.id, userName: user.name, listingId, parentId, body });
  } catch {
    redirect(`/listings/${listingId}`);
  }

  revalidatePath(`/listings/${listingId}`);
}

export async function toggleVote(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const voteType = value(formData, "voteType").toUpperCase() as VoteType;
  if (voteType !== "LIKE" && voteType !== "DISLIKE") redirect(`/listings/${listingId}`);

  try {
    await engagementService.toggleVote({ userId: user.id, listingId, voteType });
  } catch {
    redirect(`/listings/${listingId}`);
  }
  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath(`/listings/${listingId}`);
}

export async function toggleWishlist(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  try {
    await engagementService.toggleWishlist({ userId: user.id, listingId });
  } catch {
    redirect(`/listings/${listingId}`);
  }
  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/profile/${user.id}`);
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await notificationService.markAllRead(user.id);
  revalidatePath("/notifications");
}

export async function openNotification(formData: FormData) {
  const user = await requireUser();
  const notificationId = value(formData, "notificationId");
  const url = safeReturn(value(formData, "url"), "/notifications");
  await notificationService.markOneRead(notificationId, user.id);
  revalidatePath("/notifications");
  redirect(url);
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = value(formData, "name");
  const bio = value(formData, "bio");
  const phone = value(formData, "phone");
  const avatarUrl = value(formData, "avatarUrl");
  const preferredPickup = value(formData, "preferredPickup");

  try {
    await profileService.update({ userId: user.id, name, bio, phone, avatarUrl, preferredPickup });
  } catch {
    redirect("/profile/edit?error=missing");
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/edit");
  redirect(`/profile/${user.id}?profile=saved`);
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  try {
    await profileService.changePassword({ userId: user.id, currentPassword, newPassword });
  } catch {
    redirect("/profile/edit?error=password");
  }

  redirect("/profile/edit?password=changed");
}

export async function resolveReport(formData: FormData) {
  await requireAdmin();
  const reportId = value(formData, "reportId");
  await adminCommands.resolveReport(reportId);
  revalidatePath("/admin");
}

export async function hideReportedListing(formData: FormData) {
  await requireAdmin();
  const listingId = value(formData, "listingId");
  const reportId = value(formData, "reportId");
  await adminCommands.hideReportedListing({ listingId, reportId });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/buy");
  if (listingId) revalidatePath(`/listings/${listingId}`);
}

export async function removeReportedComment(formData: FormData) {
  await requireAdmin();
  const reportId = value(formData, "reportId");
  const commentId = value(formData, "commentId");
  const listingId = value(formData, "listingId");
  if (!commentId) redirect("/admin");

  await adminCommands.removeReportedComment({ commentId, reportId });

  revalidatePath("/admin");
  if (listingId) revalidatePath(`/listings/${listingId}`);
}

export async function toggleSponsoredListing(formData: FormData) {
  await requireAdmin();
  const listingId = value(formData, "listingId");
  const sponsored = value(formData, "sponsored") === "true";
  if (!listingId) redirect("/admin");

  await adminCommands.toggleSponsoredListing({ listingId, sponsored });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath(`/listings/${listingId}`);
}

export async function adminUpdateListingStatus(formData: FormData) {
  await requireAdmin();
  const listingId = value(formData, "listingId");
  const status = value(formData, "status") as ListingStatus;
  if (!listingId || !listingStatuses.includes(status as never)) redirect("/admin");

  try {
    await adminCommands.updateListingStatus({ listingId, status });
  } catch (error) {
    if (error instanceof DomainError && error.code === "LISTING_PHOTO_REQUIRED") {
      redirect("/admin?error=photo");
    }
    redirect("/admin");
  }
  revalidatePath("/admin");
  revalidatePath("/buy");
  revalidatePath("/sell");
  revalidatePath(`/listings/${listingId}`);
}

export async function updateUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = value(formData, "userId");
  const role = value(formData, "role") as UserRole;
  try {
    await adminCommands.updateUserRole({ adminId: admin.id, userId, role });
  } catch (error) {
    if (error instanceof DomainError && error.code === "ROLE_CHANGE_NOT_ALLOWED") {
      redirect(userId === admin.id ? "/admin?role=self" : "/admin?role=last");
    }
    redirect("/admin?role=missing");
  }
  revalidatePath("/admin");
}
