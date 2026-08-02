import { z } from "zod";

export const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"] as const;

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;

/** Shape of a `public.provider_packages` row (subscription plan catalog). */
export const packageRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  description_en: z.string().nullable(),
  description_ar: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  billing_interval: z.enum(BILLING_INTERVALS),
  features: z.array(z.unknown()),
  max_services: z.number().nullable(),
  max_offers: z.number().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
});

/** Shape of a `public.provider_subscriptions` row. */
export const subscriptionRowSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  package_id: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  started_at: z.string(),
  current_period_start: z.string(),
  current_period_end: z.string(),
  cancel_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  auto_renew: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createSubscriptionSchema = z.object({
  packageId: z.uuid(),
  autoRenew: z.boolean().default(true),
});

export const updateSubscriptionSchema = z
  .object({
    autoRenew: z.boolean(),
    cancel: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });
