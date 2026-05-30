"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ListingStatus, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireAdmin, requireUser, setSession } from "@/lib/auth";
import { categories, isUniversityEmail, listingStatuses, meetupPoints, orderStatuses } from "@/lib/constants";
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
  const user = await requireUser();
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const imageUrl = value(formData, "imageUrl");
  const price = Number(value(formData, "price"));

  if (!title || !description || !categories.includes(category as never) || !isHttpsUrl(imageUrl) || !Number.isFinite(price) || price <= 0) {
    redirect("/listings/new?error=missing");
  }

  const listing = await db.listing.create({
    data: {
      title,
      description,
      category,
      imageUrl,
      price,
      code: makeCode(title),
      sellerId: user.id
    }
  });

  const followers = await db.followedCategory.findMany({
    where: { category, userId: { not: user.id } },
    select: { userId: true }
  });

  if (followers.length) {
    await db.notification.createMany({
      data: followers.map((follow) => ({
        userId: follow.userId,
        title: `New ${category} listing`,
        body: `${title} is now available on campus. Code: ${listing.code}`
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
  const imageUrl = value(formData, "imageUrl");
  const price = Number(value(formData, "price"));

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) redirect("/dashboard");

  if (!title || !description || !categories.includes(category as never) || !isHttpsUrl(imageUrl) || !Number.isFinite(price) || price <= 0) {
    redirect(`/listings/${listingId}/edit?error=missing`);
  }

  await db.listing.update({
    where: { id: listingId },
    data: { title, description, category, imageUrl, price }
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
  if (!categories.includes(category as never)) redirect("/");

  await db.followedCategory.upsert({
    where: { category_userId: { category, userId: user.id } },
    update: {},
    create: { category, userId: user.id }
  });
  revalidatePath("/");
  redirect(`/?category=${encodeURIComponent(category)}`);
}

export async function placeOrder(formData: FormData) {
  const user = await requireUser();
  const listingId = value(formData, "listingId");
  const quantity = Math.max(1, Number(value(formData, "quantity")) || 1);
  const pickupPoint = value(formData, "pickupPoint");
  const note = value(formData, "note");

  if (!meetupPoints.includes(pickupPoint as never)) redirect(`/listings/${listingId}`);

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId === user.id || listing.status !== "ACTIVE") redirect(`/listings/${listingId}`);

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
      body: `${user.name} requested ${quantity} x ${listing.title}.`
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
      body: `${user.name} cancelled the request for ${order.listing.title}. Reason: ${reason}`
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
      body: `${user.name} added a payment reference for ${order.listing.title}.`
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
      body: `${order.listing.title} is now ${status.toLowerCase()} by ${user.name}.${statusNote ? ` Note: ${statusNote}` : ""}`
    }
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function markPaymentReceived(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.sellerId !== user.id) redirect("/orders");

  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "RECEIVED" } });
  await db.notification.create({
    data: {
      userId: order.buyerId,
      title: "Payment confirmed",
      body: "The seller marked your payment as received."
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

export async function markNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true }
  });
  revalidatePath("/notifications");
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = value(formData, "name");
  const bio = value(formData, "bio");
  const phone = value(formData, "phone");
  const preferredPickup = value(formData, "preferredPickup");

  if (!name || (preferredPickup && !meetupPoints.includes(preferredPickup as never))) {
    redirect("/profile/edit?error=missing");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      bio: bio || null,
      phone: phone || null,
      preferredPickup: preferredPickup || null
    }
  });

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/edit");
  redirect(`/profile/${user.id}`);
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
