import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { CategoriesRepository } from "./repository";
import type {
  Category,
  CreateCategoryInput,
  ListCategoriesParams,
  UpdateCategoryInput,
} from "./types";

/**
 * Categories business logic. Depends only on the repository interface, so it
 * can be unit-tested with a fake repository. Authorization is enforced at the
 * route boundary (and by RLS); this layer owns domain rules and not-found
 * semantics.
 */
export interface CategoriesService {
  list(params: ListCategoriesParams): Promise<Paginated<Category>>;
  get(id: string): Promise<Category>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  remove(id: string): Promise<void>;
}

export function createCategoriesService(
  repo: CategoriesRepository,
): CategoriesService {
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
      const category = await repo.findById(id);
      if (!category) throw new NotFoundError("Category not found.");
      return category;
    },

    async create(input) {
      return repo.create(input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Category not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Category not found.");
    },
  };
}
