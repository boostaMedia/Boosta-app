import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
  "disputed",
] as const;

/** Shape of a `public.orders` row from Supabase (snake_case). */
export const orderRowSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  customer_id: z.string(),
  provider_id: z.string(),
  service_id: z.string().nullable(),
  provider_quote_id: z.string().nullable(),
  offer_id: z.string().nullable(),
  status: z.enum(ORDER_STATUSES),
  subtotal: z.number(),
  discount_amount: z.number(),
  tax_amount: z.number(),
  commission_amount: z.number(),
  total_amount: z.number(),
  currency: z.string(),
  scheduled_at: z.string().nullable(),
  city_id: z.string().nullable(),
  area_id: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  cancelled_reason: z.string().nullable(),
  completed_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createOrderSchema = z.object({
  providerId: z.uuid(),
  serviceId: z.uuid().optional(),
  providerQuoteId: z.uuid().optional(),
  offerId: z.uuid().optional(),
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  currency: z.string().length(3).default("KWD"),
  scheduledAt: z.iso.datetime().optional(),
  cityId: z.uuid().optional(),
  areaId: z.uuid().optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  cancelledReason: z.string().max(1000).optional(),
});

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
});
