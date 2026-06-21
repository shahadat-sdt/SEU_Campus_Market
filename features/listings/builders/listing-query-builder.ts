import type { Prisma } from "@prisma/client";
import { listingCategories } from "@/shared/lib/constants";

export class ListingQueryBuilder {
  private where: Prisma.ListingWhereInput = { status: "ACTIVE" };
  private orderBy: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] = [
    { sponsored: "desc" },
    { createdAt: "desc" }
  ];

  withCategory(category?: string) {
    if (category && listingCategories.includes(category as never)) {
      this.where = { ...this.where, category };
    }
    return this;
  }

  withSearch(query?: string) {
    const q = query?.trim();
    if (q) {
      this.where = {
        ...this.where,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { code: { contains: q.toUpperCase(), mode: "insensitive" } },
          { tags: { has: q } }
        ]
      };
    }
    return this;
  }

  sortedBy(sort?: string) {
    if (sort === "price-low") {
      this.orderBy = { price: "asc" };
    } else if (sort === "price-high") {
      this.orderBy = { price: "desc" };
    }
    return this;
  }

  build() {
    return {
      where: this.where,
      orderBy: this.orderBy
    };
  }
}
