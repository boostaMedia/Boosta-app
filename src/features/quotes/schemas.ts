import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const QUOTE_REQUEST_STATUSES = [
  "open",
  "quoted",
  "accepted",
  "closed",
  "cancelled",
  "expired",
] as const;

/** Shape of a `public.quote_requests` row from Supabase (snake_case). */
export const quoteRequestRowSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  category_id: z.string(),
  sub_category_id: z.string().nullable(),
  city_id: z.string().nullable(),
  area_id: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  budget_min: z.number().nullable(),
  budget_max: z.number().nullable(),
  currency: z.string(),
  preferred_date: z.string().nullable(),
  attachments: z.array(z.unknown()),
  status: z.enum(QUOTE_REQUEST_STATUSES),
  expires_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createQuoteRequestSchema = z.object({
  categoryId: z.uuid(),
  subCategoryId: z.uuid().optional(),
  cityId: z.uuid().optional(),
  areaId: z.uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: z.string().length(3).default("KWD"),
  preferredDate: z.iso.datetime().optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const updateQuoteRequestSchema = createQuoteRequestSchema
  .partial()
  .extend({
    // Customers may cancel/close their own request.
    status: z.enum(["cancelled", "closed"]).optional(),
  });

export const listQuoteRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(QUOTE_REQUEST_STATUSES).optional(),
  categoryId: z.uuid().optional(),
});
