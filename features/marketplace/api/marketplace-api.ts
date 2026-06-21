import "server-only";

import { marketplaceQueryRepository } from "@/features/marketplace/repositories/marketplace-query-repository";

export const marketplaceApi = {
  homeStats() {
    return marketplaceQueryRepository.homeStats();
  },

  listings(input: { q?: string; category?: string; sort?: string; userId?: string; limit?: number }) {
    return marketplaceQueryRepository.listings(input);
  },

  listingDetail(id: string, userId?: string) {
    return marketplaceQueryRepository.listingDetail(id, userId);
  },

  listingForEdit(id: string) {
    return marketplaceQueryRepository.listingForEdit(id);
  },

  sellerDashboard(userId: string) {
    return marketplaceQueryRepository.sellerDashboard(userId);
  },

  ordersForUser(userId: string) {
    return marketplaceQueryRepository.ordersForUser(userId);
  },

  notificationsForUser(userId: string) {
    return marketplaceQueryRepository.notificationsForUser(userId);
  },

  unreadNotificationCount(userId: string) {
    return marketplaceQueryRepository.unreadNotificationCount(userId);
  },

  profile(id: string, currentUserId?: string) {
    return marketplaceQueryRepository.profile(id, currentUserId);
  },

  adminDashboard() {
    return marketplaceQueryRepository.adminDashboard();
  }
};

export type AdminDashboardData = Awaited<ReturnType<typeof marketplaceApi.adminDashboard>>;
export type SellerDashboardData = Awaited<ReturnType<typeof marketplaceApi.sellerDashboard>>;
export type OrdersForUserData = Awaited<ReturnType<typeof marketplaceApi.ordersForUser>>;
export type ListingDetailData = NonNullable<Awaited<ReturnType<typeof marketplaceApi.listingDetail>>>;
export type ProfileData = NonNullable<Awaited<ReturnType<typeof marketplaceApi.profile>>>;
