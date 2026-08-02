import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

/** Shape of a `public.categories` row as returned by Supabase (snake_case). */
export const categoryRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  icon: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug"),
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  descriptionEn: z.string().max(1000).optional(),
  descriptionAr: z.string().max(1000).optional(),
  icon: z.string().max(100).optional(),
  imageUrl: z.url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  // Query params arrive as strings; parse "true"/"false" explicitly so that
  // the literal string "false" is not coerced to `true`.
  activeOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  search: z.string().trim().min(1).max(100).optional(),
});
