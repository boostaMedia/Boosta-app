import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { rangeFor } from "@/lib/api";

import type { ListPaymentsParams, Payment, PaymentRow } from "./types";

const TABLE = "payments";

/** Maps a row to the client-safe entity (drops `gateway_payload`). */
function toEntity(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    providerId: row.provider_id,
    method: row.method,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    gateway: row.gateway,
    gatewayReference: row.gateway_reference,
    refundedAmount: row.refunded_amount,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS =
  "id, order_id, user_id, provider_id, method, status, amount, currency, gateway, gateway_reference, refunded_amount, paid_at, created_at, updated_at";

export interface PaymentsRepository {
  list(
    params: ListPaymentsParams,
  ): Promise<{ items: Payment[]; total: number }>;
  findById(id: string): Promise<Payment | null>;
}

export function createPaymentsRepository(
  supabase: SupabaseClient,
): PaymentsRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase.from(TABLE).select(COLUMNS, { count: "exact" });

      if (params.orderId) query = query.eq("order_id", params.orderId);
      if (params.status) query = query.eq("status", params.status);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as PaymentRow[]).map(toEntity),
        total: count ?? 0,
      };
    },

    async findById(id) {
      const { data, error } = await supabase
        .from(TABLE)
        .select(COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as PaymentRow) : null;
    },
  };
}
