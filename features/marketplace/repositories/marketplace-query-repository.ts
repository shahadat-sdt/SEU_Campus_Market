import "server-only";

import { ListingQueryBuilder } from "@/features/listings/builders/listing-query-builder";
import { db } from "@/shared/lib/db";

export const marketplaceQueryRepository = {
  homeStats() {
    return Promise.all([
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { listings: { some: { status: "ACTIVE" } } } })
    ]);
  },

  listings(input: { q?: string; category?: string; sort?: string; userId?: string; limit?: number }) {
    const listingQuery = new ListingQueryBuilder()
      .withCategory(input.category)
      .withSearch(input.q)
      .sortedBy(input.sort)
      .build();

    return db.listing.findMany({
      where: listingQuery.where,
      include: {
        seller: true,
        votes: { select: { voteType: true } },
        wishlistItems: input.userId ? { where: { userId: input.userId }, select: { id: true } } : false
      },
      orderBy: listingQuery.orderBy,
      take: input.limit ?? 48
    });
  },

  listingDetail(id: string, userId?: string) {
    return db.listing.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            reviewsReceived: {
              include: { buyer: { select: { id: true, name: true } } },
              orderBy: { createdAt: "desc" },
              take: 8
            }
          }
        },
        reports: { select: { id: true } },
        orders: { where: { status: { not: "CANCELLED" } }, select: { quantity: true } },
        votes: { select: { voteType: true } },
        wishlistItems: userId ? { where: { userId }, select: { id: true } } : false,
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, name: true } },
            replies: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" },
              take: 10
            }
          },
          orderBy: { createdAt: "desc" },
          take: 25
        }
      }
    });
  },

  listingForEdit(id: string) {
    return db.listing.findUnique({ where: { id } });
  },

  sellerDashboard(userId: string) {
    return Promise.all([
      db.listing.findMany({
        where: { sellerId: userId },
        include: { orders: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
        take: 60
      }),
      db.order.findMany({
        where: { sellerId: userId, status: "COMPLETED" },
        select: { agreedPrice: true },
        take: 200
      }),
      db.order.findMany({
        where: { sellerId: userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      })
    ]);
  },

  ordersForUser(userId: string) {
    return Promise.all([
      db.order.findMany({
        where: { buyerId: userId },
        include: { listing: true, seller: true, review: true },
        orderBy: { createdAt: "desc" }
      }),
      db.order.findMany({
        where: { sellerId: userId },
        include: { listing: true, buyer: true },
        orderBy: { createdAt: "desc" }
      })
    ]);
  },

  notificationsForUser(userId: string) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  },

  unreadNotificationCount(userId: string) {
    return db.notification.count({ where: { userId, read: false } });
  },

  profile(id: string, currentUserId?: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            wishlistItems: true,
            reviewsReceived: true
          }
        },
        listings: {
          where: currentUserId === id ? {} : { status: "ACTIVE" },
          include: {
            seller: true,
            votes: { select: { voteType: true } },
            wishlistItems: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false
          },
          orderBy: { createdAt: "desc" },
          take: 24
        },
        purchases: { include: { listing: true, seller: true }, orderBy: { createdAt: "desc" }, take: 12 },
        wishlistItems: {
          include: {
            listing: {
              include: {
                seller: true,
                votes: { select: { voteType: true } },
                wishlistItems: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 24
        },
        reviewsReceived: {
          include: { buyer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 12
        }
      }
    });
  },

  adminDashboard() {
    return Promise.all([
      db.report.findMany({
        where: { resolved: false },
        include: {
          user: true,
          listing: { include: { seller: true } },
          comment: { include: { user: true, listing: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      db.user.findMany({
        include: {
          _count: {
            select: {
              listings: true,
              purchases: true,
              sales: true,
              reports: true
            }
          }
        },
        orderBy: [{ role: "desc" }, { createdAt: "desc" }],
        take: 24
      }),
      db.listing.findMany({
        include: { seller: true, reports: { where: { resolved: false }, select: { id: true } } },
        orderBy: [{ sponsored: "desc" }, { createdAt: "desc" }],
        take: 30
      }),
      db.report.count({ where: { resolved: false } }),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.listing.count({ where: { status: "HIDDEN" } }),
      db.listing.count({ where: { sponsored: true } }),
      db.order.count(),
      db.user.count({ where: { role: "ADMIN" } })
    ]);
  }
};
