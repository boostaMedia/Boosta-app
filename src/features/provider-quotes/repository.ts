import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { providerQuoteRowSchema } from "./schemas";
import type {
  CreateProviderQuoteInput,
  ListProviderQuotesParams,
  ProviderQuote,
  UpdateProviderQuoteInput,
} from "./types";

type ProviderQuoteRow = z.infer<typeof providerQuoteRowSchema>;

const TABLE = "provider_quotes";

function toEntity(row: ProviderQuoteRow): ProviderQuote {
  return {
    id: row.id,
    quoteRequestId: row.quote_request_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    amount: row.amount,
    currency: row.currency,
    message: row.message,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    validUntil: row.valid_until,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(
  input: Partial<CreateProviderQuoteInput & UpdateProviderQuoteInput>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.serviceId !== undefined) row.service_id = input.serviceId;
  if (input.amount !== undefined) row.amount = input.amount;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.message !== undefined) row.message = input.message;
  if (input.estimatedDurationMinutes !== undefined)
    row.estimated_duration_minutes = input.estimatedDurationMinutes;
  if (input.validUntil !== undefined) row.valid_until = input.validUntil;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      "You have already submitted a quote for this request.",
    );
  }
  throw new Error(error.message);
}

export interface ProviderQuotesRepository {
  list(
    params: ListProviderQuotesParams,
  ): Promise<{ items: ProviderQuote[]; total: number }>;
  findById(id: string): Promise<ProviderQuote | null>;
  create(
    providerId: string,
    input: CreateProviderQuoteInput,
  ): Promise<ProviderQuote>;
  update(
    id: string,
    input: UpdateProviderQuoteInput,
  ): Promise<ProviderQuote | null>;
}

export function createProviderQuotesRepository(
  supabase: SupabaseClient,
): ProviderQuotesRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase.from(TABLE).select("*", { count: "exact" });

      if (params.quoteRequestId)
        query = query.eq("quote_request_id", params.quoteRequestId);
      if (params.providerId) query = query.eq("provider_id", params.providerId);
      if (params.status) query = query.eq("status", params.status);

      const { data, error, count } = await query
        .order("amount", { ascending: true })
        .range(from, to);

      if (error) raise(error);
      return {
        items: ((data ?? []) as ProviderQuoteRow[]).map(toEntity),
        total: count ?? 0,
      };
    },

    async findById(id) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ProviderQuoteRow) : null;
    },

    async create(providerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          ...toRow(input),
          provider_id: providerId,
          quote_request_id: input.quoteRequestId,
        })
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as ProviderQuoteRow);
    },

    async update(id, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(input))
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ProviderQuoteRow) : null;
    },
  };
}
