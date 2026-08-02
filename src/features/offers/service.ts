import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { OffersRepository } from "./repository";
import type {
  CreateOfferInput,
  ListOffersParams,
  Offer,
  UpdateOfferInput,
} from "./types";

export interface OffersService {
  list(params: ListOffersParams): Promise<Paginated<Offer>>;
  get(id: string): Promise<Offer>;
  create(providerId: string, input: CreateOfferInput): Promise<Offer>;
  update(id: string, input: UpdateOfferInput): Promise<Offer>;
  remove(id: string): Promise<void>;
}

export function createOffersService(repo: OffersRepository): OffersService {
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
      const offer = await repo.findById(id);
      if (!offer) throw new NotFoundError("Offer not found.");
      return offer;
    },

    async create(providerId, input) {
      return repo.create(providerId, input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Offer not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Offer not found.");
    },
  };
}
