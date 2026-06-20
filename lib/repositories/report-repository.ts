import { db } from "@/lib/db";

export const reportRepository = {
  createListingReport(data: { listingId: string; userId: string; reason: string }) {
    return db.report.create({ data });
  },

  createCommentReport(data: { commentId: string; listingId: string; userId: string; reason: string }) {
    return db.report.create({ data });
  },

  resolve(reportId: string) {
    return db.report.update({ where: { id: reportId }, data: { resolved: true } });
  }
};
