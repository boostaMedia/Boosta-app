import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { ProvidersRepository } from "./repository";
import type {
  AdminUpdateProviderInput,
  CreateProviderInput,
  ListProvidersParams,
  Provider,
  UpdateProviderInput,
} from "./types";

/**
 * Providers business logic. Owner vs. admin field separation is enforced by
 * exposing distinct `updateOwner` / `updateAdmin` methods — a provider can
 * never set their own `status` / `isFeatured` / `commissionRate`.
 */
export interface ProvidersService {
  list(params: ListProvidersParams): Promise<Paginated<Provider>>;
  get(id: string): Promise<Provider>;
  getBySlug(slug: string): Promise<Provider>;
  create(userId: string, input: CreateProviderInput): Promise<Provider>;
  updateOwner(id: string, input: UpdateProviderInput): Promise<Provider>;
  updateAdmin(id: string, input: AdminUpdateProviderInput): Promise<Provider>;
  remove(id: string): Promise<void>;
}

export function createProvidersService(
  repo: ProvidersRepository,
): ProvidersService {
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
      const provider = await repo.findById(id);
      if (!provider) throw new NotFoundError("Provider not found.");
      return provider;
    },

    async getBySlug(slug) {
      const provider = await repo.findBySlug(slug);
      if (!provider) throw new NotFoundError("Provider not found.");
      return provider;
    },

    async create(userId, input) {
      return repo.create(userId, input);
    },

    async updateOwner(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Provider not found.");
      return updated;
    },

    async updateAdmin(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Provider not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Provider not found.");
    },
  };
}
