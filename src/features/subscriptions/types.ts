import type { z } from "zod";

import type {
  BILLING_INTERVALS,
  createSubscriptionSchema,
  packageRowSchema,
  SUBSCRIPTION_STATUSES,
  subscriptionRowSchema,
  updateSubscriptionSchema,
} from "./schemas";

export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** A subscription plan from the catalog. */
export interface ProviderPackage {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  features: unknown[];
  maxServices: number | null;
  maxOffers: number | null;
  isActive: boolean;
  sortOrder: number;
}

/** A provider's active/historical subscription. */
export interface Subscription {
  id: string;
  providerId: string;
  packageId: string;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PackageRow = z.infer<typeof packageRowSchema>;
export type SubscriptionRow = z.infer<typeof subscriptionRowSchema>;

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

/** Data the repository needs to create a subscription (period pre-computed). */
export interface CreateSubscriptionData {
  packageId: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
}
