import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { serviceRowSchema } from "./schemas";
import type {
  CreateServiceInput,
  ListServicesParams,
  Service,
  UpdateServiceInput,
} from "./types";

type ServiceRow = z.infer<typeof serviceRowSchema>;

const TABLE = "services";

function toEntity(row: ServiceRow): Service {
  return {
    id: row.id,
    providerId: row.provider_id,
    categoryId: row.category_id,
    subCategoryId: row.sub_category_id,
    slug: row.slug,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    basePrice: row.base_price,
    currency: row.currency,
    priceType: row.price_type,
    durationMinutes: row.duration_minutes,
    status: row.status,
    isFeatured: row.is_featured,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateServiceInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.subCategoryId !== undefined)
    row.sub_category_id = input.subCategoryId;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.titleEn !== undefined) row.title_en = input.titleEn;
  if (input.titleAr !== undefined) row.title_ar = input.titleAr;
  if (input.descriptionEn !== undefined)
    row.description_en = input.descriptionEn;
  if (input.descriptionAr !== undefined)
    row.description_ar = input.descriptionAr;
  if (input.basePrice !== undefined) row.base_price = input.basePrice;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.priceType !== undefined) row.price_type = input.priceType;
  if (input.durationMinutes !== undefined)
    row.duration_minutes = input.durationMinutes;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, "");
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      "A service with this slug already exists for this provider.",
    );
  }
  throw new Error(error.message);
}

export interface ServicesRepository {
  list(
    params: ListServicesParams,
  ): Promise<{ items: Service[]; total: number }>;
  findById(id: string): Promise<Service | null>;
  create(providerId: string, input: CreateServiceInput): Promise<Service>;
  update(id: string, input: UpdateServiceInput): Promise<Service | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createServicesRepository(
  supabase: SupabaseClient,
): ServicesRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.categoryId) query = query.eq("category_id", params.categoryId);
      if (params.subCategoryId)
        query = query.eq("sub_category_id", params.subCategoryId);
      if (params.providerId) query = query.eq("provider_id", params.providerId);
      if (params.status) query = query.eq("status", params.status);
      if (params.search) {
        const term = sanitizeSearch(params.search);
        query = query.or(
          `title_en.ilike.%${term}%,title_ar.ilike.%${term}%,slug.ilike.%${term}%`,
        );
      }

      const { data, error, count } = await query
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false })
        .range(from, to);

      if (error) raise(error);
      return {
        items: ((data ?? []) as ServiceRow[]).map(toEntity),
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
      return data ? toEntity(data as ServiceRow) : null;
    },

    async create(providerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(input), provider_id: providerId })
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as ServiceRow);
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
      return data ? toEntity(data as ServiceRow) : null;
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
