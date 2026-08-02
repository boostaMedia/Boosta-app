import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { categoryRowSchema } from "./schemas";
import type {
  Category,
  CreateCategoryInput,
  ListCategoriesParams,
  UpdateCategoryInput,
} from "./types";

type CategoryRow = z.infer<typeof categoryRowSchema>;

const TABLE = "categories";

function toEntity(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    icon: row.icon,
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<CreateCategoryInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.nameEn !== undefined) row.name_en = input.nameEn;
  if (input.nameAr !== undefined) row.name_ar = input.nameAr;
  if (input.descriptionEn !== undefined)
    row.description_en = input.descriptionEn;
  if (input.descriptionAr !== undefined)
    row.description_ar = input.descriptionAr;
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
}

/** Escape characters that are meaningful inside PostgREST filter strings. */
function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, "");
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError("A category with this slug already exists.");
  }
  throw new Error(error.message);
}

export interface CategoriesRepository {
  list(
    params: ListCategoriesParams,
  ): Promise<{ items: Category[]; total: number }>;
  findById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createCategoriesRepository(
  supabase: SupabaseClient,
): CategoriesRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.activeOnly) query = query.eq("is_active", true);

      if (params.search) {
        const term = sanitizeSearch(params.search);
        query = query.or(
          `name_en.ilike.%${term}%,name_ar.ilike.%${term}%,slug.ilike.%${term}%`,
        );
      }

      const { data, error, count } = await query
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true })
        .range(from, to);

      if (error) raise(error);
      return {
        items: ((data ?? []) as CategoryRow[]).map(toEntity),
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
      return data ? toEntity(data as CategoryRow) : null;
    },

    async create(input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(input))
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as CategoryRow);
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
      return data ? toEntity(data as CategoryRow) : null;
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
