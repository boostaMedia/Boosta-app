import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const SERVICE_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

export const PRICE_TYPES = [
  "fixed",
  "starting_from",
  "hourly",
  "quote",
] as const;

/** Shape of a `public.services` row from Supabase (snake_case). */
export const serviceRowSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  category_id: z.string(),
  sub_category_id: z.string().nullable(),
  slug: z.string(),
  title_en: z.string(),
  title_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  base_price: z.number(),
  currency: z.string(),
  price_type: z.enum(PRICE_TYPES),
  duration_minutes: z.number().nullable(),
  status: z.enum(SERVICE_STATUSES),
  is_featured: z.boolean(),
  rating: z.number(),
  reviews_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createServiceSchema = z.object({
  categoryId: z.uuid(),
  subCategoryId: z.uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug"),
  titleEn: z.string().min(1).max(160),
  titleAr: z.string().min(1).max(160),
  descriptionEn: z.string().max(4000).optional(),
  descriptionAr: z.string().max(4000).optional(),
  basePrice: z.number().min(0).default(0),
  currency: z.string().length(3).default("KWD"),
  priceType: z.enum(PRICE_TYPES).default("fixed"),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(SERVICE_STATUSES).default("draft"),
});

export const updateServiceSchema = createServiceSchema.partial();

export const listServicesQuerySchema = paginationQuerySchema.extend({
  categoryId: z.uuid().optional(),
  subCategoryId: z.uuid().optional(),
  providerId: z.uuid().optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});
