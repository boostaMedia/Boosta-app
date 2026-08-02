import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type { createCategorySchema, updateCategorySchema } from "./schemas";

/** Domain entity (camelCase) exposed by the categories service. */
export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface ListCategoriesParams extends PaginationQuery {
  activeOnly: boolean;
  search?: string;
}
