import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { BusinessListingsRepository } from "./repository";
import type {
  BusinessListing,
  CreateBusinessListingInput,
  ListBusinessListingsParams,
  UpdateBusinessListingInput,
} from "./types";

/**
 * Business-listings ("Projects for Sale") business logic. Depends only on
 * the repository interface, matching the layering used across every other
 * feature module in this codebase.
 */
export interface BusinessListingsService {
  list(params: ListBusinessListingsParams): Promise<Paginated<BusinessListing>>;
  get(id: string): Promise<BusinessListing>;
  create(
    providerId: string,
    input: CreateBusinessListingInput,
  ): Promise<BusinessListing>;
  update(
    id: string,
    input: UpdateBusinessListingInput,
  ): Promise<BusinessListing>;
  remove(id: string): Promise<void>;
}

export function createBusinessListingsService(
  repo: BusinessListingsRepository,
): BusinessListingsService {
  return {
    async list(params) {
      const { items, total } = await repo.list(params);
      return {
        items,
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      };
    },

    async get(id) {
      const listing = await repo.findById(id);
      if (!listing) throw new NotFoundError("Business listing not found.");
      return listing;
    },

    async create(providerId, input) {
      return repo.create(providerId, input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Business listing not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Business listing not found.");
    },
  };
}
