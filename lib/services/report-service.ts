import "server-only";

import { commentReport, listingReport } from "@/lib/factories/report-factory";
import { reportRepository } from "@/lib/repositories/report-repository";

export const reportService = {
  createListingReport(input: { listingId: string; userId: string; reason?: string }) {
    return reportRepository.createListingReport(listingReport(input));
  },

  createCommentReport(input: { commentId: string; listingId: string; userId: string; reason?: string }) {
    return reportRepository.createCommentReport(commentReport(input));
  },

  resolve(reportId: string) {
    return reportRepository.resolve(reportId);
  }
};
