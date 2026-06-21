import "server-only";

import bcrypt from "bcryptjs";
import { DomainError } from "@/shared/lib/domain/errors";
import { userRepository } from "@/features/profile/repositories/user-repository";
import { isUniversityEmail } from "@/shared/lib/constants";

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    if (!input.name || !input.email || input.password.length < 6) {
      throw new DomainError("Registration data is incomplete.", "INVALID_REGISTRATION");
    }
    if (!isUniversityEmail(input.email)) {
      throw new DomainError("Use a university email.", "INVALID_EMAIL");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      return await userRepository.create({ name: input.name, email: input.email, passwordHash });
    } catch {
      throw new DomainError("User already exists.", "USER_EXISTS");
    }
  },

  async authenticate(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new DomainError("Invalid credentials.", "INVALID_CREDENTIALS");
    }

    return user;
  }
};
