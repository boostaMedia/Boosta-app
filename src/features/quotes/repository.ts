import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";

import type { quoteRequestRowSchema } from "./schemas";
import type {
  CreateQuoteRequestInput,
  ListQuoteRequestsParams,
  QuoteRequest,
  UpdateQuoteRequestInput,
} from "./types";

type QuoteRequestRow = z.infer<typeof quoteRequestRowSchema>;

const TABLE = "quote_requests";

function toEntity(row: QuoteRequestRow): QuoteRequest {
  return {
    id: row.id,
    customerId: row.customer_id,
    categoryId: row.category_id,
    subCategoryId: row.sub_category_id,
    cityId: row.city_id,
    areaId: row.area_id,
    title: row.title,
    description: row.description,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    currency: row.currency,
    preferredDate: row.preferred_date,
    attachments: row.attachments,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(
  input: Partial<CreateQuoteRequestInput & { status: string }>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.subCategoryId !== undefined)
    row.sub_category_id = input.subCategoryId;
  if (input.cityId !== undefined) row.city_id = input.cityId;
  if (input.areaId !== undefined) row.area_id = input.areaId;
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.budgetMin !== undefined) row.budget_min = input.budgetMin;
  if (input.budgetMax !== undefined) row.budget_max = input.budgetMax;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.preferredDate !== undefined)
    row.preferred_date = input.preferredDate;
  if (input.expiresAt !== undefined) row.expires_at = input.expiresAt;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export interface QuotesRepository {
  list(
    params: ListQuoteRequestsParams,
  ): Promise<{ items: QuoteRequest[]; total: number }>;
  findById(id: string): Promise<QuoteRequest | null>;
  create(
    customerId: string,
    input: CreateQuoteRequestInput,
  ): Promise<QuoteRequest>;
  update(
    id: string,
    input: UpdateQuoteRequestInput,
  ): Promise<QuoteRequest | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createQuotesRepository(
  supabase: SupabaseClient,
): QuotesRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.status) query = query.eq("status", params.status);
      if (params.categoryId) query = query.eq("category_id", params.categoryId);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as QuoteRequestRow[]).map(toEntity),
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
      return data ? toEntity(data as QuoteRequestRow) : null;
    },

    async create(customerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...toRow(input), customer_id: customerId })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toEntity(data as QuoteRequestRow);
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
      return data ? toEntity(data as QuoteRequestRow) : null;
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
