import "server-only";

import type { ListingStatus } from "@prisma/client";
import { DomainError } from "@/lib/domain/errors";
import { dispatchDomainEvent } from "@/lib/events/domain-event-bus";
import { createListingCode } from "@/lib/factories/listing-code-factory";
import { categoryFollowRepository } from "@/lib/repositories/category-follow-repository";
import { listingRepository, type ListingCreateInput, type ListingUpdateInput } from "@/lib/repositories/listing-repository";
import {
  canManageListing,
  isValidListingPayload,
  isValidListingStatus,
  shouldArchiveListing,
  type ListingPayload
} from "@/lib/specifications/listing-specification";
import { ListingWriteWorkflow } from "@/lib/templates/listing-write-workflow";

export type ListingWriteInput = ListingPayload & {
  quantity: number;
  imageUrls: string[];
  tags: string[];
  negotiable: boolean;
  campusPickup: boolean;
  whatsappContact: boolean;
  deliveryAvailable: boolean;
};

type CreateInput = {
  userId: string;
  payload: ListingWriteInput;
  status: ListingStatus;
};

class CreateListingWorkflow extends ListingWriteWorkflow<CreateInput, Awaited<ReturnType<typeof listingRepository.create>>> {
  protected validate(input: CreateInput) {
    if (!isValidListingPayload(input.payload) || !isValidListingStatus(input.status)) {
      throw new DomainError("Listing data is invalid.", "INVALID_LISTING");
    }
  }

  protected authorize(input: CreateInput) {
    if (!input.userId) throw new DomainError("Login required.", "LOGIN_REQUIRED");
  }

  protected async persist(input: CreateInput) {
    const duplicate = await listingRepository.findDuplicate({
      sellerId: input.userId,
      title: input.payload.title,
      description: input.payload.description,
      category: input.payload.category,
      price: input.payload.price,
      since: new Date(Date.now() - 5000)
    });
    if (duplicate) {
      throw new DomainError(duplicate.id, "DUPLICATE_LISTING");
    }

    const data: ListingCreateInput = {
      ...input.payload,
      status: input.status,
      code: createListingCode(input.payload.title),
      sellerId: input.userId
    };

    return listingRepository.create(data);
  }

  protected async afterPersist(input: CreateInput, listing: Awaited<ReturnType<typeof listingRepository.create>>) {
    if (input.status !== "ACTIVE") return;
    const followers = await categoryFollowRepository.followersForCategory(input.payload.category, input.userId);
    await dispatchDomainEvent({
      type: "listing.published",
      category: input.payload.category,
      listingId: listing.id,
      listingCode: listing.code,
      listingTitle: listing.title,
      followerIds: followers.map((follow) => follow.userId)
    });
  }
}

type UpdateInput = {
  userId: string;
  listingId: string;
  payload: ListingWriteInput;
};

class UpdateListingWorkflow extends ListingWriteWorkflow<UpdateInput, Awaited<ReturnType<typeof listingRepository.update>>> {
  protected validate(input: UpdateInput) {
    if (!isValidListingPayload(input.payload)) {
      throw new DomainError("Listing data is invalid.", "INVALID_LISTING");
    }
  }

  protected async authorize(input: UpdateInput) {
    const listing = await listingRepository.findById(input.listingId);
    if (!canManageListing(input.userId, listing)) {
      throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");
    }
  }

  protected persist(input: UpdateInput) {
    const data: ListingUpdateInput = input.payload;
    return listingRepository.update(input.listingId, data);
  }
}

const createWorkflow = new CreateListingWorkflow();
const updateWorkflow = new UpdateListingWorkflow();

export const listingService = {
  create(input: CreateInput) {
    return createWorkflow.execute(input);
  },

  update(input: UpdateInput) {
    return updateWorkflow.execute(input);
  },

  async updateStatus(userId: string, listingId: string, status: string) {
    if (!isValidListingStatus(status)) throw new DomainError("Invalid listing status.", "INVALID_LISTING_STATUS");

    const listing = await listingRepository.findById(listingId);
    if (!canManageListing(userId, listing)) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");

    return listingRepository.setStatus(listingId, status);
  },

  async deleteOrArchive(userId: string, listingId: string) {
    const listing = await listingRepository.findForDelete(listingId);
    if (!canManageListing(userId, listing)) throw new DomainError("Listing not found.", "LISTING_NOT_FOUND");

    if (shouldArchiveListing(listing.orders.length)) {
      return listingRepository.setStatus(listingId, "HIDDEN");
    }

    return listingRepository.delete(listingId);
  },

  async followCategory(userId: string, category: string) {
    if (!category) throw new DomainError("Category is required.", "INVALID_CATEGORY");
    return categoryFollowRepository.follow(category, userId);
  }
};
