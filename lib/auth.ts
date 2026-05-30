import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const cookieName = "seu_market_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export async function setSession(userId: string) {
  const store = await cookies();
  const value = `${userId}.${sign(userId)}`;
  store.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getCurrentUser() {
  const store = await cookies();
  const raw = store.get(cookieName)?.value;
  if (!raw) return null;

  const [userId, signature] = raw.split(".");
  if (!userId || signature !== sign(userId)) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      verified: true,
      role: true,
      bio: true,
      phone: true,
      preferredPickup: true,
      createdAt: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.verified) redirect("/verify");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
