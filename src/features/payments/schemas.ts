import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const PAYMENT_METHODS = [
  "knet",
  "visa",
  "mastercard",
  "apple_pay",
  "google_pay",
  "wallet",
  "cash",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

/** Shape of a `public.payments` row from Supabase (snake_case). */
export const paymentRowSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  user_id: z.string(),
  provider_id: z.string().nullable(),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  amount: z.number(),
  currency: z.string(),
  gateway: z.string(),
  gateway_reference: z.string().nullable(),
  refunded_amount: z.number(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
  orderId: z.uuid().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
});
