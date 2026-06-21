import "server-only";

import { DomainError } from "@/shared/lib/domain/errors";
import { listingRepository } from "@/features/listings/repositories/listing-repository";
import { reportService } from "@/features/reports/services/report-service";
import { canChangeUserRole, isValidRole } from "@/features/profile/specifications/user-specification";
import { hasListingPhoto, isValidListingStatus } from "@/features/listings/specifications/listing-specification";
import { userRepository } from "@/features/profile/repositories/user-repository";
import { commentRepository } from "@/features/comments/repositories/comment-repository";

export const adminCommands = {
  resolveReport(reportId: string) {
    return reportService.resolve(reportId);
  },

  async hideReportedListing(input: { listingId?: string; reportId?: string }) {
    if (input.listingId) {
      await listingRepository.setStatus(input.listingId, "HIDDEN");
    }
    if (input.reportId) {
      await reportService.resolve(input.reportId);
    }
  },

  async removeReportedComment(input: { commentId: string; reportId?: string }) {
    if (!input.commentId) throw new DomainError("Comment is required.", "COMMENT_REQUIRED");
    if (input.reportId) {
      await reportService.resolve(input.reportId);
    }
    await commentRepository.delete(input.commentId);
  },

  async toggleSponsoredListing(input: { listingId: string; sponsored: boolean }) {
    if (!input.listingId) throw new DomainError("Listing is required.", "LISTING_REQUIRED");
    await listingRepository.setSponsored(input.listingId, input.sponsored);
  },

  async updateListingStatus(input: { listingId: string; status: string }) {
    if (!input.listingId || !isValidListingStatus(input.status)) {
      throw new DomainError("Invalid listing status.", "INVALID_LISTING_STATUS");
    }
    if (input.status === "ACTIVE") {
      const listing = await listingRepository.findById(input.listingId);
      if (!listing) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");
      if (!hasListingPhoto(listing)) {
        throw new DomainError("Upload at least one photo before publishing.", "LISTING_PHOTO_REQUIRED");
      }
    }
    await listingRepository.setStatus(input.listingId, input.status);
  },

  async updateUserRole(input: { adminId: string; userId: string; role: string }) {
    if (!input.userId || !isValidRole(input.role)) throw new DomainError("Invalid role.", "INVALID_ROLE");

    const target = await userRepository.findById(input.userId);
    if (!target) throw new DomainError("User not found.", "USER_NOT_FOUND");

    const adminCount = await userRepository.countAdmins();
    if (
      !canChangeUserRole({
        adminId: input.adminId,
        targetUserId: input.userId,
        targetRole: target.role,
        newRole: input.role,
        adminCount
      })
    ) {
      throw new DomainError("Role change is not allowed.", "ROLE_CHANGE_NOT_ALLOWED");
    }

    await userRepository.updateRole(input.userId, input.role);
  }
};
