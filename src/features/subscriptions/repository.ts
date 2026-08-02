import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ConflictError } from "@/lib/errors";

import type {
  CreateSubscriptionData,
  PackageRow,
  ProviderPackage,
  Subscription,
  SubscriptionRow,
} from "./types";

function toPackage(row: PackageRow): ProviderPackage {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    price: row.price,
    currency: row.currency,
    billingInterval: row.billing_interval,
    features: row.features,
    maxServices: row.max_services,
    maxOffers: row.max_offers,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    providerId: row.provider_id,
    packageId: row.package_id,
    status: row.status,
    startedAt: row.started_at,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAt: row.cancel_at,
    cancelledAt: row.cancelled_at,
    autoRenew: row.auto_renew,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SubscriptionPatch {
  autoRenew?: boolean;
  status?: string;
  cancelledAt?: string;
}

export interface SubscriptionsRepository {
  listPackages(): Promise<ProviderPackage[]>;
  findPackage(id: string): Promise<ProviderPackage | null>;
  listSubscriptions(): Promise<Subscription[]>;
  findSubscription(id: string): Promise<Subscription | null>;
  create(
    providerId: string,
    data: CreateSubscriptionData,
  ): Promise<Subscription>;
  update(id: string, patch: SubscriptionPatch): Promise<Subscription | null>;
}

export function createSubscriptionsRepository(
  supabase: SupabaseClient,
): SubscriptionsRepository {
  return {
    async listPackages() {
      const { data, error } = await supabase
        .from("provider_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as PackageRow[]).map(toPackage);
    },

    async findPackage(id) {
      const { data, error } = await supabase
        .from("provider_packages")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toPackage(data as PackageRow) : null;
    },

    async listSubscriptions() {
      const { data, error } = await supabase
        .from("provider_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return ((data ?? []) as SubscriptionRow[]).map(toSubscription);
    },

    async findSubscription(id) {
      const { data, error } = await supabase
        .from("provider_subscriptions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toSubscription(data as SubscriptionRow) : null;
    },

    async create(providerId, data) {
      const { data: row, error } = await supabase
        .from("provider_subscriptions")
        .insert({
          provider_id: providerId,
          package_id: data.packageId,
          status: "active",
          current_period_end: data.currentPeriodEnd,
          auto_renew: data.autoRenew,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new ConflictError(
            "This provider already has an active subscription.",
          );
        }
        throw new Error(error.message);
      }
      return toSubscription(row as SubscriptionRow);
    },

    async update(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.autoRenew !== undefined) row.auto_renew = patch.autoRenew;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.cancelledAt !== undefined) row.cancelled_at = patch.cancelledAt;

      const { data, error } = await supabase
        .from("provider_subscriptions")
        .update(row)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toSubscription(data as SubscriptionRow) : null;
    },
  };
}
