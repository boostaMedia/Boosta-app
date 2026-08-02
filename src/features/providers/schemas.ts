import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const PROVIDER_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const;

/** Shape of a `public.providers` row from Supabase (snake_case). */
export const providerRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  slug: z.string(),
  business_name_en: z.string(),
  business_name_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  logo_url: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(PROVIDER_STATUSES),
  is_featured: z.boolean(),
  rating: z.number(),
  reviews_count: z.number(),
  city_id: z.string().nullable(),
  area_id: z.string().nullable(),
  commission_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Fields a provider may set when creating their own profile. */
export const createProviderSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug"),
  businessNameEn: z.string().min(1).max(160),
  businessNameAr: z.string().min(1).max(160),
  descriptionEn: z.string().max(2000).optional(),
  descriptionAr: z.string().max(2000).optional(),
  logoUrl: z.url().optional(),
  coverUrl: z.url().optional(),
  cityId: z.uuid().optional(),
  areaId: z.uuid().optional(),
});

/** Owner-editable fields (never status / featured / commission). */
export const updateProviderSchema = createProviderSchema.partial();

/** Admin-only moderation fields. */
export const adminUpdateProviderSchema = z
  .object({
    status: z.enum(PROVIDER_STATUSES),
    isFeatured: z.boolean(),
    commissionRate: z.number().min(0).max(100),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const listProvidersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  cityId: z.uuid().optional(),
  featured: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  status: z.enum(PROVIDER_STATUSES).optional(),
});
