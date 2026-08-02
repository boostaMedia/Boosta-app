import { z } from "zod";

import { PAGINATION } from "@/lib/constants";
import type { Paginated } from "@/types";

/**
 * Reusable pagination query schema. Coerces `page` / `pageSize` from strings
 * and clamps `pageSize` to a sane maximum.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** The inclusive `[from, to]` row range for a Supabase `.range()` call. */
export function rangeFor({ page, pageSize }: PaginationQuery): {
  from: number;
  to: number;
} {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** Build a {@link Paginated} envelope from items + total count. */
export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationQuery,
): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
