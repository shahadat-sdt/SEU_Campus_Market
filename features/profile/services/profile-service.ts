import "server-only";

import bcrypt from "bcryptjs";
import { meetupPoints } from "@/shared/lib/constants";
import { DomainError } from "@/shared/lib/domain/errors";
import { userRepository } from "@/features/profile/repositories/user-repository";

function isHttpsUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export const profileService = {
  update(input: { userId: string; name: string; bio: string; phone: string; avatarUrl: string; preferredPickup: string }) {
    if (!input.name || (input.preferredPickup && !meetupPoints.includes(input.preferredPickup as never))) {
      throw new DomainError("Profile data is invalid.", "INVALID_PROFILE");
    }

    return userRepository.updateProfile(input.userId, {
      name: input.name,
      avatarUrl: input.avatarUrl && isHttpsUrl(input.avatarUrl) ? input.avatarUrl : null,
      bio: input.bio || null,
      phone: input.phone || null,
      preferredPickup: input.preferredPickup || null
    });
  },

  async changePassword(input: { userId: string; currentPassword: string; newPassword: string }) {
    if (input.newPassword.length < 6) {
      throw new DomainError("Password is too short.", "INVALID_PASSWORD");
    }

    const user = await userRepository.findById(input.userId);
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new DomainError("Current password is invalid.", "INVALID_PASSWORD");
    }

    await userRepository.updatePasswordHash(input.userId, await bcrypt.hash(input.newPassword, 12));
  }
};
