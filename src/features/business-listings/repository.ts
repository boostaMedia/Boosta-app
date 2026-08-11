import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { businessListingRowSchema } from "./schemas";
import type {
  BusinessListing,
  CreateBusinessListingInput,
  ListBusinessListingsParams,
  UpdateBusinessListingInput,
} from "./types";

type BusinessListingRow = z.infer<typeof businessListingRowSchema>;

const TABLE = "business_listings";

function toEntity(row: BusinessListingRow): BusinessListing {
  return {
    id: row.id,
    providerId: row.provider_id,
    slug: row.slug,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    industryEn: row.industry_en,
    industryAr: row.industry_ar,
    askingPrice: row.asking_price,
    currency: row.currency,
    monthlyRevenue: row.monthly_revenue,
    establishedYear: row.established_year,
    cityId: row.city_id,
    status: row.status,
    isFeatured: row.is_featured,
    viewsCount: row.views_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(
  input: Partial<CreateBusinessListingInput>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.titleEn !== undefined) row.title_en = input.titleEn;
  if (input.titleAr !== undefined) row.title_ar = input.titleAr;
  if (input.descriptionEn !== undefined)
    row.description_en = input.descriptionEn;
  if (input.descriptionAr !== undefined)
    row.description_ar = input.descriptionAr;
  if (input.industryEn !== undefined) row.industry_en = input.industryEn;
  if (input.industryAr !== undefined) row.industry_ar = input.industryAr;
  if (input.askingPrice !== undefined) row.asking_price = input.askingPrice;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.monthlyRevenue !== undefined)
    row.monthly_revenue = input.monthlyRevenue;
  if (input.establishedYear !== undefined)
    row.established_year = input.establishedYear;
  if (input.cityId !== undefined) row.city_id = input.cityId;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, "");
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      "A business listing with this slug already exists for this provider.",
    );
  }
  throw new Error(error.message);
}

export interface BusinessListingsRepository {
  list(
    params: ListBusinessListingsParams,
  ): Promise<{ items: BusinessListing[]; total: number }>;
  findById(id: string): Promise<BusinessListing | null>;
  create(
    providerId: string,
    input: CreateBusinessListingInput,
  ): Promise<BusinessListing>;
  update(
    id: string,
    input: UpdateBusinessListingInput,
  ): Promise<BusinessListing | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createBusinessListingsRepository(
  supabase: SupabaseClient,
): BusinessListingsRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.providerId) query = query.eq("provider_id", params.providerId);
      if (params.cityId) query = query.eq("city_id", params.cityId);
      if (params.status) query = query.eq("status", params.status);
      if (params.featuredOnly) query = query.eq("is_featured", true);
      if (params.search) {
        const term = sanitizeSearch(params.search);
        query = query.or(
          `title_en.ilike.%${term}%,title_ar.ilike.%${term}%,slug.ilike.%${term}%`,
        );
      }

      const { data, error, count } = await query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) raise(error);
      return {
        items: ((data ?? []) as BusinessListingRow[]).map(toEntity),
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
      return data ? toEntity(data as BusinessListingRow) : null;
    },

    async create(providerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(input), provider_id: providerId })
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as BusinessListingRow);
    },

    async update(id, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(input))
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as BusinessListingRow) : null;
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
