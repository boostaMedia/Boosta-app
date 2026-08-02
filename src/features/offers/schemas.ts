import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const OFFER_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "expired",
  "inactive",
] as const;

export const DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;

/** Shape of a `public.offers` row from Supabase (snake_case). */
export const offerRowSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  service_id: z.string().nullable(),
  title_en: z.string(),
  title_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  discount_type: z.enum(DISCOUNT_TYPES),
  discount_value: z.number(),
  original_price: z.number().nullable(),
  final_price: z.number().nullable(),
  currency: z.string(),
  starts_at: z.string(),
  ends_at: z.string().nullable(),
  status: z.enum(OFFER_STATUSES),
  max_redemptions: z.number().nullable(),
  redemptions_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createOfferSchema = z.object({
  serviceId: z.uuid().optional(),
  titleEn: z.string().min(1).max(160),
  titleAr: z.string().min(1).max(160),
  descriptionEn: z.string().max(2000).optional(),
  descriptionAr: z.string().max(2000).optional(),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  finalPrice: z.number().min(0).optional(),
  currency: z.string().length(3).default("KWD"),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
  status: z.enum(OFFER_STATUSES).default("draft"),
  maxRedemptions: z.number().int().positive().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

export const listOffersQuerySchema = paginationQuerySchema.extend({
  providerId: z.uuid().optional(),
  serviceId: z.uuid().optional(),
  status: z.enum(OFFER_STATUSES).optional(),
});
