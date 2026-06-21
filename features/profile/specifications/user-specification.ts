import type { UserRole } from "@prisma/client";

export function isValidRole(role: string): role is UserRole {
  return role === "ADMIN" || role === "STUDENT";
}

export function canChangeUserRole(input: {
  adminId: string;
  targetUserId: string;
  targetRole: UserRole;
  newRole: UserRole;
  adminCount: number;
}) {
  if (input.adminId === input.targetUserId) return false;
  if (input.targetRole === "ADMIN" && input.newRole === "STUDENT" && input.adminCount <= 1) return false;
  return true;
}
