"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireUser, setSession } from "@/lib/auth";
import { categories, isUniversityEmail, meetupPoints, orderStatuses } from "@/lib/constants";
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
  const verificationToken = crypto.randomBytes(18).toString("hex");

  try {
    await db.user.create({
      data: { name, email, passwordHash, verificationToken }
    });
  } catch {
    redirect("/register?error=exists");
  }

  redirect(`/verify?registered=1&token=${verificationToken}`);
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }
  if (!user.verified) {
    redirect(`/verify?email=${encodeURIComponent(email)}`);
  }

  await setSession(user.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function verifyAccount(formData: FormData) {
  const token = value(formData, "token");
  const user = await db.user.update({
    where: { verificationToken: token },
    data: { verified: true, verificationToken: null }
  });
  await setSession(user.id);
  redirect("/");
}

export async function createListing(formData: FormData) {
  const user = await requireUser();
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const imageUrl = value(formData, "imageUrl");
  const price = Number(value(formData, "price"));

  if (!title || !description || !categories.includes(category as never) || !imageUrl || !price) {
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
  if (!listing || listing.sellerId === user.id) redirect(`/listings/${listingId}`);

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

export async function updateOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = value(formData, "orderId");
  const status = value(formData, "status") as OrderStatus;
  if (!orderStatuses.includes(status as never)) redirect("/orders");

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, listing: true }
  });
  if (!order || order.sellerId !== user.id) redirect("/orders");

  await db.order.update({ where: { id: orderId }, data: { status } });
  await db.notification.create({
    data: {
      userId: order.buyerId,
      title: `Order ${status.toLowerCase()}`,
      body: `${order.listing.title} is now ${status.toLowerCase()} by ${user.name}.`
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
