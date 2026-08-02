import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { ReviewsRepository } from "./repository";
import type {
  CreateReviewInput,
  ListReviewsParams,
  Review,
  UpdateReviewInput,
} from "./types";

/**
 * Reviews business logic. Two distinct actors: the customer owns the review
 * body (`updateOwn`), while the provider may only append a reply (`reply`).
 * RLS enforces who each row is visible/writable to.
 */
export interface ReviewsService {
  list(params: ListReviewsParams): Promise<Paginated<Review>>;
  get(id: string): Promise<Review>;
  create(customerId: string, input: CreateReviewInput): Promise<Review>;
  updateOwn(id: string, input: UpdateReviewInput): Promise<Review>;
  reply(id: string, reply: string): Promise<Review>;
  remove(id: string): Promise<void>;
}

export function createReviewsService(repo: ReviewsRepository): ReviewsService {
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
      const review = await repo.findById(id);
      if (!review) throw new NotFoundError("Review not found.");
      return review;
    },

    async create(customerId, input) {
      return repo.create(customerId, input);
    },

    async updateOwn(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Review not found.");
      return updated;
    },

    async reply(id, reply) {
      const updated = await repo.reply(id, reply);
      if (!updated) throw new NotFoundError("Review not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Review not found.");
    },
  };
}
