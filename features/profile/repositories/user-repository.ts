import type { UserRole } from "@prisma/client";
import { db } from "@/shared/lib/db";

export type UserProfileUpdateInput = {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  preferredPickup: string | null;
};

export const userRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return db.user.findUnique({ where: { id } });
  },

  findSessionUser(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        bio: true,
        phone: true,
        preferredPickup: true,
        createdAt: true
      }
    });
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return db.user.create({ data });
  },

  updateProfile(id: string, data: UserProfileUpdateInput) {
    return db.user.update({ where: { id }, data });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return db.user.update({ where: { id }, data: { passwordHash } });
  },

  updateRole(id: string, role: UserRole) {
    return db.user.update({ where: { id }, data: { role } });
  },

  countAdmins() {
    return db.user.count({ where: { role: "ADMIN" } });
  }
};
