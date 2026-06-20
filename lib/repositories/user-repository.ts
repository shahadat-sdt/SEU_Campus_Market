import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export const userRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return db.user.findUnique({ where: { id } });
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return db.user.create({ data });
  },

  updateRole(id: string, role: UserRole) {
    return db.user.update({ where: { id }, data: { role } });
  },

  countAdmins() {
    return db.user.count({ where: { role: "ADMIN" } });
  }
};
