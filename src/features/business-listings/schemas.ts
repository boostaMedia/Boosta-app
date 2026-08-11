import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const BUSINESS_LISTING_STATUSES = [
  "draft",
  "active",
  "under_offer",
  "sold",
  "inactive",
] as const;

/** Shape of a `public.business_listings` row from Supabase (snake_case). */
export const businessListingRowSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  slug: z.string(),
  title_en: z.string(),
  title_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  industry_en: z.string().nullable(),
  industry_ar: z.string().nullable(),
  asking_price: z.number(),
  currency: z.string(),
  monthly_revenue: z.number().nullable(),
  established_year: z.number().nullable(),
  city_id: z.string().nullable(),
  status: z.enum(BUSINESS_LISTING_STATUSES),
  is_featured: z.boolean(),
  views_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createBusinessListingSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug"),
  titleEn: z.string().min(1).max(160),
  titleAr: z.string().min(1).max(160),
  descriptionEn: z.string().max(4000).optional(),
  descriptionAr: z.string().max(4000).optional(),
  industryEn: z.string().max(120).optional(),
  industryAr: z.string().max(120).optional(),
  askingPrice: z.number().min(0),
  currency: z.string().length(3).default("KWD"),
  monthlyRevenue: z.number().min(0).optional(),
  establishedYear: z.number().int().min(1900).max(2100).optional(),
  cityId: z.uuid().optional(),
  status: z.enum(BUSINESS_LISTING_STATUSES).default("draft"),
});

export const updateBusinessListingSchema =
  createBusinessListingSchema.partial();

export const listBusinessListingsQuerySchema = paginationQuerySchema.extend({
  providerId: z.uuid().optional(),
  cityId: z.uuid().optional(),
  status: z.enum(BUSINESS_LISTING_STATUSES).optional(),
  featuredOnly: z.coerce.boolean().default(false),
  search: z.string().trim().min(1).max(120).optional(),
});
