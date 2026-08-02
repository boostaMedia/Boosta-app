import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { ServicesRepository } from "./repository";
import type {
  CreateServiceInput,
  ListServicesParams,
  Service,
  UpdateServiceInput,
} from "./types";

/**
 * Services business logic. Ownership is enforced by RLS (updates/deletes of a
 * non-owned service resolve to not-found) plus resolving the caller's provider
 * id at the route boundary before create.
 */
export interface ServicesService {
  list(params: ListServicesParams): Promise<Paginated<Service>>;
  get(id: string): Promise<Service>;
  create(providerId: string, input: CreateServiceInput): Promise<Service>;
  update(id: string, input: UpdateServiceInput): Promise<Service>;
  remove(id: string): Promise<void>;
}

export function createServicesService(
  repo: ServicesRepository,
): ServicesService {
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
      const service = await repo.findById(id);
      if (!service) throw new NotFoundError("Service not found.");
      return service;
    },

    async create(providerId, input) {
      return repo.create(providerId, input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Service not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Service not found.");
    },
  };
}
