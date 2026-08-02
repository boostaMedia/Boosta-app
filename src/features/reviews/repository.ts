import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import { ConflictError } from "@/lib/errors";

import type { reviewRowSchema } from "./schemas";
import type {
  CreateReviewInput,
  ListReviewsParams,
  Review,
  UpdateReviewInput,
} from "./types";

type ReviewRow = z.infer<typeof reviewRowSchema>;

const TABLE = "reviews";

function toEntity(row: ReviewRow): Review {
  return {
    id: row.id,
    orderId: row.order_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    customerId: row.customer_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    status: row.status,
    providerReply: row.provider_reply,
    providerRepliedAt: row.provider_replied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function raise(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new ConflictError("A review already exists for this order.");
  }
  throw new Error(error.message);
}

export interface ReviewsRepository {
  list(params: ListReviewsParams): Promise<{ items: Review[]; total: number }>;
  findById(id: string): Promise<Review | null>;
  create(customerId: string, input: CreateReviewInput): Promise<Review>;
  update(id: string, input: UpdateReviewInput): Promise<Review | null>;
  reply(id: string, reply: string): Promise<Review | null>;
  softDelete(id: string): Promise<boolean>;
}

export function createReviewsRepository(
  supabase: SupabaseClient,
): ReviewsRepository {
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

      if (error) raise(error);
      return {
        items: ((data ?? []) as ReviewRow[]).map(toEntity),
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
      return data ? toEntity(data as ReviewRow) : null;
    },

    async create(customerId, input) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          customer_id: customerId,
          provider_id: input.providerId,
          service_id: input.serviceId ?? null,
          order_id: input.orderId ?? null,
          rating: input.rating,
          title: input.title ?? null,
          comment: input.comment ?? null,
        })
        .select("*")
        .single();
      if (error) raise(error);
      return toEntity(data as ReviewRow);
    },

    async update(id, input) {
      const patch: Record<string, unknown> = {};
      if (input.rating !== undefined) patch.rating = input.rating;
      if (input.title !== undefined) patch.title = input.title;
      if (input.comment !== undefined) patch.comment = input.comment;

      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ReviewRow) : null;
    },

    async reply(id, reply) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          provider_reply: reply,
          provider_replied_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) raise(error);
      return data ? toEntity(data as ReviewRow) : null;
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
