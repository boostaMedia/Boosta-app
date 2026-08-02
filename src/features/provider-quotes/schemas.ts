import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const PROVIDER_QUOTE_STATUSES = [
  "submitted",
  "accepted",
  "rejected",
  "withdrawn",
  "expired",
] as const;

/** Shape of a `public.provider_quotes` row from Supabase (snake_case). */
export const providerQuoteRowSchema = z.object({
  id: z.string(),
  quote_request_id: z.string(),
  provider_id: z.string(),
  service_id: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  message: z.string().nullable(),
  estimated_duration_minutes: z.number().nullable(),
  valid_until: z.string().nullable(),
  status: z.enum(PROVIDER_QUOTE_STATUSES),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createProviderQuoteSchema = z.object({
  quoteRequestId: z.uuid(),
  serviceId: z.uuid().optional(),
  amount: z.number().min(0),
  currency: z.string().length(3).default("KWD"),
  message: z.string().max(2000).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  validUntil: z.iso.datetime().optional(),
});

export const updateProviderQuoteSchema = z
  .object({
    amount: z.number().min(0),
    message: z.string().max(2000),
    estimatedDurationMinutes: z.number().int().positive(),
    validUntil: z.iso.datetime(),
    status: z.enum(["withdrawn"]),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const listProviderQuotesQuerySchema = paginationQuerySchema.extend({
  quoteRequestId: z.uuid().optional(),
  providerId: z.uuid().optional(),
  status: z.enum(PROVIDER_QUOTE_STATUSES).optional(),
});
