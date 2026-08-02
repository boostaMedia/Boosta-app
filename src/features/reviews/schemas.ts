import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const REVIEW_STATUSES = ["published", "pending", "hidden"] as const;

/** Shape of a `public.reviews` row from Supabase (snake_case). */
export const reviewRowSchema = z.object({
  id: z.string(),
  order_id: z.string().nullable(),
  provider_id: z.string(),
  service_id: z.string().nullable(),
  customer_id: z.string(),
  rating: z.number(),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  status: z.enum(REVIEW_STATUSES),
  provider_reply: z.string().nullable(),
  provider_replied_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createReviewSchema = z.object({
  providerId: z.uuid(),
  serviceId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(160).optional(),
  comment: z.string().max(2000).optional(),
});

/** Customer-editable fields only (never provider_reply / status). */
export const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(160),
    comment: z.string().max(2000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const listReviewsQuerySchema = paginationQuerySchema.extend({
  providerId: z.uuid().optional(),
  serviceId: z.uuid().optional(),
  status: z.enum(REVIEW_STATUSES).optional(),
});
