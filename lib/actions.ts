"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ListingStatus, OrderStatus, VoteType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireAdmin, requireUser, setSession } from "@/lib/auth";
import { appUrl, sendTransactionalEmail } from "@/lib/email";
import { isUniversityEmail, listingCategories, listingConditions, listingStatuses, meetupPoints, orderStatuses } from "@/lib/constants";
import { db } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function makeCode(title: string) {
  const prefix = title
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  return `${prefix}-${crypto.randomInt(1000, 9999)}`;
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

function productUrl(listingId: string) {
  return `/listings/${listingId}`;
}

function orderUrl(orderId?: string) {
  return orderId ? `/orders?order=${orderId}` : "/orders";
}

async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/dashboard?verify=required");
  return user;
}

async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expires
    }
  });

  await sendTransactionalEmail({
    to: email,
    name,
    subject: "Verify your SEU Campus Market account",
    html: `<p>Hi ${name},</p><p>Verify your SEU Campus Market account within 24 hours:</p><p><a href="${appUrl(`/verify-email?token=${token}`)}">Verify email</a></p>`
  });
}

function safeReturn(path: string, fallback: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function register(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (!name || !email || password.length < 6) {
    redirect("/register?error=missing");
  }
  if (!isUniversityEmail(email)) {
    redirect("/register?error=email");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let userId = "";

  try {
    const user = await db.user.create({
      data: { name, email, passwordHash }
    });
    userId = user.id;
    await sendVerificationEmail(user.id, user.email, user.name);
  } catch {
    redirect("/register?error=exists");
  }

  await setSession(userId);
  redirect("/");
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await setSession(user.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function createListing(formData: FormData) {
  const user = await requireVerifiedUser();
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const condition = value(formData, "condition") || "Good";
  const imageUrls = parseJsonArray(value(formData, "imageUrls")).filter(isHttpsUrl).slice(0, 4);
  const imageUrl = imageUrls[0] || value(formData, "imageUrl");
  const tags = parseJsonArray(value(formData, "tags")).slice(0, 5);
  const price = Number(value(formData, "price"));
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const intent = value(formData, "intent");
  const negotiable = value(formData, "negotiable") === "true";
  const campusPickup = value(formData, "campusPickup") === "on";
  const whatsappContact = value(formData, "whatsappContact") === "on";
  const deliveryAvailable = value(formData, "deliveryAvailable") === "on";
  const status: ListingStatus = intent === "draft" ? "DRAFT" : "ACTIVE";

  if (
    !title ||
    title.length > 60 ||
    !description ||
    description.length > 300 ||
    !listingCategories.includes(category as never) ||
    !listingConditions.includes(condition as never) ||
    !isHttpsUrl(imageUrl) ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    redirect("/listings/new?error=missing");
  }

  const duplicate = await db.listing.findFirst({
    where: {
      sellerId: user.id,
      title,
      description,
      category,
      price,
      createdAt: { gte: new Date(Date.now() - 5000) }
    },
    orderBy: { createdAt: "desc" }
  });
  if (duplicate) redirect(`/listings/${duplicate.id}?duplicate=1`);

  const listing = await db.listing.create({
    data: {
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
      status,
      price,
      code: makeCode(title),
      sellerId: user.id
    }
  });

  const followers = await db.followedCategory.findMany({
    where: { category, userId: { not: user.id } },
    select: { userId: true }
  });

  if (status === "ACTIVE" && followers.length) {
    await db.notification.createMany({
      data: followers.map((follow) => ({
        userId: follow.userId,
        title: `New ${category} listing`,
        body: `${title} is now available on campus. Code: ${listing.code}`,
        productId: listing.id,
        productTitle: listing.title,
        url: productUrl(listing.id)
      }))
    });
  }

  revalidatePath("/");
  redirect(`/listings/${listing.id}`);
}

export async function updateListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const condition = value(formData, "condition") || "Good";
  const imageUrls = parseJsonArray(value(formData, "imageUrls")).filter(isHttpsUrl).slice(0, 4);
  const imageUrl = imageUrls[0] || value(formData, "imageUrl");
  const tags = parseJsonArray(value(formData, "tags")).slice(0, 5);
  const price = Number(value(formData, "price"));
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const negotiable = value(formData, "negotiable") === "true";
  const campusPickup = value(formData, "campusPickup") === "on";
  const whatsappContact = value(formData, "whatsappContact") === "on";
  const deliveryAvailable = value(formData, "deliveryAvailable") === "on";

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) redirect("/dashboard");

  if (!title || title.length > 60 || !description || description.length > 300 || !listingCategories.includes(category as never) || !listingConditions.includes(condition as never) || !isHttpsUrl(imageUrl) || !Number.isFinite(price) || price <= 0) {
    redirect(`/listings/${listingId}/edit?error=missing`);
  }

  await db.listing.update({
    where: { id: listingId },
    data: {
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

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}`);
}

export async function updateListingStatus(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const status = value(formData, "status") as ListingStatus;
  const returnTo = value(formData, "returnTo");
  if (!listingStatuses.includes(status as never)) redirect("/dashboard");

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) redirect("/dashboard");

  await db.listing.update({ where: { id: listingId }, data: { status } });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);
  redirect(safeReturn(returnTo, "/dashboard"));
}

export async function deleteListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { orders: { select: { id: true } } }
  });

  if (!listing || listing.sellerId !== user.id) redirect("/dashboard");

  if (listing.orders.length) {
    await db.listing.update({ where: { id: listingId }, data: { status: "HIDDEN" } });
  } else {
    await db.listing.delete({ where: { id: listingId } });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function followCategory(formData: FormData) {
  const user = await requireUser();
  const category = value(formData, "category");
  if (!listingCategories.includes(category as never)) redirect("/");

  await db.followedCategory.upsert({
    where: { category_userId: { category, userId: user.id } },
    update: {},
    create: { category, userId: user.id }
  });
  revalidatePath("/");
  redirect(`/?category=${encodeURIComponent(category)}`);
}

export async function placeOrder(formData: FormData) {
  const user = await requireVerifiedUser();
  const listingId = value(formData, "listingId");
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const pickupPoint = value(formData, "pickupPoint");
  const note = value(formData, "note");

  if (!meetupPoints.includes(pickupPoint as never)) redirect(`/listings/${listingId}`);

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { orders: { where: { status: { not: "CANCELLED" } }, select: { quantity: true } } }
  });
  if (!listing || listing.sellerId === user.id || listing.status !== "ACTIVE") redirect(`/listings/${listingId}`);
  const reserved = listing.orders.reduce((sum, order) => sum + order.quantity, 0);
  const available = Math.max(0, listing.quantity - reserved);
  if (quantity > available) redirect(`/listings/${listingId}?error=stock`);

  const order = await db.order.create({
    data: {
      listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
      quantity,
      agreedPrice: Number(listing.price) * quantity,
      pickupPoint,
      note
    }
  });

  await db.notification.create({
    data: {
      userId: listing.sellerId,
      title: "New order request",
      body: `New order for '${listing.title}' - View order ${order.id.slice(-6).toUpperCase()}`,
      productId: listing.id,
      productTitle: listing.title,
      orderId: order.id,
      url: orderUrl(order.id)
    }
  });

  revalidatePath("/orders");
  redirect(`/orders?created=${order.id}`);
}

export async function cancelOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const reason = value(formData, "reason") || "Cancelled by buyer";

  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order || order.buyerId !== user.id || order.status !== "PENDING") redirect("/orders");

  await db.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED", statusNote: reason }
  });
  await db.notification.create({
    data: {
      userId: order.sellerId,
      title: "Order cancelled",
      body: `${user.name} cancelled the request for ${order.listing.title}. Reason: ${reason}`,
      productId: order.listingId,
      productTitle: order.listing.title,
      orderId: order.id,
      url: orderUrl(order.id)
    }
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function addPaymentNote(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const paymentNote = value(formData, "paymentNote");
  if (!paymentNote) redirect("/orders");

  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order || order.buyerId !== user.id || order.status === "CANCELLED") redirect("/orders");

  await db.order.update({ where: { id: orderId }, data: { paymentNote } });
  await db.notification.create({
    data: {
      userId: order.sellerId,
      title: "Payment note submitted",
      body: `${user.name} added a payment reference for ${order.listing.title}.`,
      productId: order.listingId,
      productTitle: order.listing.title,
      orderId: order.id,
      url: orderUrl(order.id)
    }
  });
  revalidatePath("/orders");
}

export async function updateOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const status = value(formData, "status") as OrderStatus;
  const statusNote = value(formData, "statusNote");
  if (!orderStatuses.includes(status as never)) redirect("/orders");

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, listing: true }
  });
  if (!order || order.sellerId !== user.id) redirect("/orders");

  await db.order.update({ where: { id: orderId }, data: { status, statusNote: status === "CANCELLED" ? statusNote || "Cancelled by seller" : statusNote || null } });
  if (status === "COMPLETED") {
    await db.listing.update({ where: { id: order.listingId }, data: { status: "SOLD" } });
  }
  await db.notification.create({
    data: {
      userId: order.buyerId,
      title: `Order ${status.toLowerCase()}`,
      body: `${order.listing.title} is now ${status.toLowerCase()} by ${user.name}.${statusNote ? ` Note: ${statusNote}` : ""}`,
      productId: order.listingId,
      productTitle: order.listing.title,
      orderId: order.id,
      url: orderUrl(order.id)
    }
  });

  await sendTransactionalEmail({
    to: order.buyer.email,
    name: order.buyer.name,
    subject: `Order update: ${order.listing.title}`,
    html: `<p>Your order for <strong>${order.listing.title}</strong> is now ${status.toLowerCase()}.</p>${statusNote ? `<p>${statusNote}</p>` : ""}`
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function markPaymentReceived(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order || order.sellerId !== user.id) redirect("/orders");

  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });
  await db.notification.create({
    data: {
      userId: order.buyerId,
      title: "Payment confirmed",
      body: `The seller marked payment for ${order.listing.title} as received.`,
      productId: order.listingId,
      productTitle: order.listing.title,
      orderId: order.id,
      url: orderUrl(order.id)
    }
  });
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function createReview(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const rating = Math.min(5, Math.max(1, Number(value(formData, "rating")) || 5));
  const comment = value(formData, "comment");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user.id || order.status !== "COMPLETED") redirect("/orders");

  await db.review.create({
    data: { orderId, buyerId: user.id, sellerId: order.sellerId, rating, comment }
  });
  revalidatePath("/orders");
  revalidatePath(`/profile/${order.sellerId}`);
}

export async function reportListing(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const reason = value(formData, "reason") || "Suspicious listing";
  await db.report.create({ data: { listingId, userId: user.id, reason } });
  revalidatePath(`/listings/${listingId}`);
}

export async function reportComment(formData: FormData) {
  const user = await requireUser();
  const commentId = value(formData, "commentId");
  const listingId = value(formData, "listingId");
  const reason = value(formData, "reason") || "Reported comment";
  await db.report.create({ data: { commentId, listingId, userId: user.id, reason } });
  revalidatePath(`/listings/${listingId}`);
}

export async function createComment(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const parentId = value(formData, "parentId");
  const body = value(formData, "body");
  if (!body || body.length > 500) redirect(`/listings/${listingId}`);

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) redirect("/");

  await db.comment.create({
    data: {
      listingId,
      userId: user.id,
      parentId: parentId || null,
      body
    }
  });

  if (listing.sellerId !== user.id) {
    await db.notification.create({
      data: {
        userId: listing.sellerId,
        title: "New product comment",
        body: `${user.name} commented on '${listing.title}'.`,
        productId: listing.id,
        productTitle: listing.title,
        url: productUrl(listing.id)
      }
    });
  }

  revalidatePath(`/listings/${listingId}`);
}

export async function toggleVote(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const voteType = value(formData, "voteType").toUpperCase() as VoteType;
  if (voteType !== "LIKE" && voteType !== "DISLIKE") redirect(`/listings/${listingId}`);

  const existing = await db.vote.findUnique({ where: { listingId_userId: { listingId, userId: user.id } } });
  if (existing?.voteType === voteType) {
    await db.vote.delete({ where: { id: existing.id } });
  } else {
    await db.vote.upsert({
      where: { listingId_userId: { listingId, userId: user.id } },
      update: { voteType },
      create: { listingId, userId: user.id, voteType }
    });
  }
  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
}

export async function toggleWishlist(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const existing = await db.wishlistItem.findUnique({ where: { listingId_userId: { listingId, userId: user.id } } });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await db.wishlistItem.create({ data: { listingId, userId: user.id } });
  }
  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/profile/${user.id}`);
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true }
  });
  revalidatePath("/notifications");
}

export async function openNotification(formData: FormData) {
  const user = await requireUser();
  const notificationId = value(formData, "notificationId");
  const url = safeReturn(value(formData, "url"), "/notifications");
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true }
  });
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

  if (!name || (preferredPickup && !meetupPoints.includes(preferredPickup as never))) {
    redirect("/profile/edit?error=missing");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      avatarUrl: avatarUrl && isHttpsUrl(avatarUrl) ? avatarUrl : null,
      bio: bio || null,
      phone: phone || null,
      preferredPickup: preferredPickup || null
    }
  });

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/edit");
  redirect(`/profile/${user.id}?profile=saved`);
}

export async function resendVerificationEmail() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) {
    await sendVerificationEmail(user.id, user.email, user.name);
  }
  revalidatePath("/dashboard");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  if (newPassword.length < 6) redirect("/profile/edit?error=password");

  const record = await db.user.findUnique({ where: { id: user.id } });
  if (!record || !(await bcrypt.compare(currentPassword, record.passwordHash))) {
    redirect("/profile/edit?error=password");
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) }
  });
  redirect("/profile/edit?password=changed");
}

export async function resolveReport(formData: FormData) {
  await requireAdmin();
  const reportId = value(formData, "reportId");
  await db.report.update({ where: { id: reportId }, data: { resolved: true } });
  revalidatePath("/admin");
}

export async function hideReportedListing(formData: FormData) {
  await requireAdmin();
  const listingId = value(formData, "listingId");
  const reportId = value(formData, "reportId");
  if (listingId) {
    await db.listing.update({ where: { id: listingId }, data: { status: "HIDDEN" } });
  }
  if (reportId) {
    await db.report.update({ where: { id: reportId }, data: { resolved: true } });
  }
  revalidatePath("/admin");
  revalidatePath("/");
  if (listingId) revalidatePath(`/listings/${listingId}`);
}

export async function toggleSponsoredListing(formData: FormData) {
  await requireAdmin();
  const listingId = value(formData, "listingId");
  const sponsored = value(formData, "sponsored") === "true";
  if (!listingId) redirect("/admin");

  await db.listing.update({
    where: { id: listingId },
    data: { sponsored }
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
}
