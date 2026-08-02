import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";

import type { offerRowSchema } from "./schemas";
import type {
  CreateOfferInput,
  ListOffersParams,
  Offer,
  UpdateOfferInput,
} from "./types";

type OfferRow = z.infer<typeof offerRowSchema>;

const TABLE = "offers";

function toEntity(row: OfferRow): Offer {
  return {
    id: row.id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    originalPrice: row.original_price,
    finalPrice: row.final_price,
    currency: row.currency,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    maxRedemptions: row.max_redemptions,
    redemptionsCount: row.redemptions_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateOfferInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.serviceId !== undefined) row.service_id = input.serviceId;
  if (input.titleEn !== undefined) row.title_en = input.titleEn;
  if (input.titleAr !== undefined) row.title_ar = input.titleAr;
  if (input.descriptionEn !== undefined)
    row.description_en = input.descriptionEn;
  if (input.descriptionAr !== undefined)
    row.description_ar = input.descriptionAr;
  if (input.discountType !== undefined) row.discount_type = input.discountType;
  if (input.discountValue !== undefined)
    row.discount_value = input.discountValue;
  if (input.originalPrice !== undefined)
    row.original_price = input.originalPrice;
  if (input.finalPrice !== undefined) row.final_price = input.finalPrice;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.startsAt !== undefined) row.starts_at = input.startsAt;
  if (input.endsAt !== undefined) row.ends_at = input.endsAt;
  if (input.status !== undefined) row.status = input.status;
  if (input.maxRedemptions !== undefined)
    row.max_redemptions = input.maxRedemptions;
  return row;
}

export interface OffersRepository {
  list(params: ListOffersParams): Promise<{ items: Offer[]; total: number }>;
  findById(id: string): Promise<Offer | null>;
  create(providerId: string, input: CreateOfferInput): Promise<Offer>;
  update(id: string, input: UpdateOfferInput): Promise<Offer | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createOffersRepository(
  supabase: SupabaseClient,
): OffersRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.providerId) query = query.eq("provider_id", params.providerId);
      if (params.serviceId) query = query.eq("service_id", params.serviceId);
      if (params.status) query = query.eq("status", params.status);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as OfferRow[]).map(toEntity),
        total: count ?? 0,
      };
    },

    async findById(id) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as OfferRow) : null;
    },

    async create(providerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(input), provider_id: providerId })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toEntity(data as OfferRow);
    },

    async update(id, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(input))
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as OfferRow) : null;
    },

    async softDelete(id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data != null;
    },
  };
}
