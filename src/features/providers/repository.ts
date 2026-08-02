import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { providerRowSchema } from "./schemas";
import type {
  CreateProviderInput,
  ListProvidersParams,
  Provider,
  ProviderPatch,
} from "./types";

type ProviderRow = z.infer<typeof providerRowSchema>;

const TABLE = "providers";

function toEntity(row: ProviderRow): Provider {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    businessNameEn: row.business_name_en,
    businessNameAr: row.business_name_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    status: row.status,
    isFeatured: row.is_featured,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    cityId: row.city_id,
    areaId: row.area_id,
    commissionRate: row.commission_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(patch: Partial<ProviderPatch>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.businessNameEn !== undefined)
    row.business_name_en = patch.businessNameEn;
  if (patch.businessNameAr !== undefined)
    row.business_name_ar = patch.businessNameAr;
  if (patch.descriptionEn !== undefined)
    row.description_en = patch.descriptionEn;
  if (patch.descriptionAr !== undefined)
    row.description_ar = patch.descriptionAr;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl;
  if (patch.cityId !== undefined) row.city_id = patch.cityId;
  if (patch.areaId !== undefined) row.area_id = patch.areaId;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.commissionRate !== undefined)
    row.commission_rate = patch.commissionRate;
  return row;
}

function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, "");
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      "A provider with this slug or owner already exists.",
    );
  }
  throw new Error(error.message);
}

export interface ProvidersRepository {
  list(
    params: ListProvidersParams,
  ): Promise<{ items: Provider[]; total: number }>;
  findById(id: string): Promise<Provider | null>;
  findBySlug(slug: string): Promise<Provider | null>;
  create(userId: string, input: CreateProviderInput): Promise<Provider>;
  update(id: string, patch: ProviderPatch): Promise<Provider | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createProvidersRepository(
  supabase: SupabaseClient,
): ProvidersRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.status) query = query.eq("status", params.status);
      if (params.cityId) query = query.eq("city_id", params.cityId);
      if (params.featured) query = query.eq("is_featured", true);
      if (params.search) {
        const term = sanitizeSearch(params.search);
        query = query.or(
          `business_name_en.ilike.%${term}%,business_name_ar.ilike.%${term}%,slug.ilike.%${term}%`,
        );
      }

      const { data, error, count } = await query
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false })
        .range(from, to);

      if (error) raise(error);
      return {
        items: ((data ?? []) as ProviderRow[]).map(toEntity),
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
      if (error) raise(error);
      return data ? toEntity(data as ProviderRow) : null;
    },

    async findBySlug(slug) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("slug", slug)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ProviderRow) : null;
    },

    async create(userId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(input), user_id: userId })
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as ProviderRow);
    },

    async update(id, patch) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(patch))
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ProviderRow) : null;
    },

    async softDelete(id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id")
        .maybeSingle();
      if (error) raise(error);
      return data != null;
    },
  };
}
