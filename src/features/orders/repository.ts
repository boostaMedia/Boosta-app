import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";

import type { orderRowSchema } from "./schemas";
import type {
  CreateOrderData,
  ListOrdersParams,
  Order,
  UpdateOrderStatusInput,
} from "./types";

type OrderRow = z.infer<typeof orderRowSchema>;

const TABLE = "orders";

function toEntity(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    providerQuoteId: row.provider_quote_id,
    offerId: row.offer_id,
    status: row.status,
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    taxAmount: row.tax_amount,
    commissionAmount: row.commission_amount,
    totalAmount: row.total_amount,
    currency: row.currency,
    scheduledAt: row.scheduled_at,
    cityId: row.city_id,
    areaId: row.area_id,
    address: row.address,
    notes: row.notes,
    cancelledReason: row.cancelled_reason,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface OrdersRepository {
  list(params: ListOrdersParams): Promise<{ items: Order[]; total: number }>;
  findById(id: string): Promise<Order | null>;
  create(customerId: string, data: CreateOrderData): Promise<Order>;
  updateStatus(
    id: string,
    input: UpdateOrderStatusInput,
  ): Promise<Order | null>;
}

export function createOrdersRepository(
  supabase: SupabaseClient,
): OrdersRepository {
  return {
    async list(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.status) query = query.eq("status", params.status);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as OrderRow[]).map(toEntity),
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
      return data ? toEntity(data as OrderRow) : null;
    },

    async create(customerId, data) {
      const { data: row, error } = await supabase
        .from(TABLE)
        .insert({
          customer_id: customerId,
          provider_id: data.providerId,
          service_id: data.serviceId ?? null,
          provider_quote_id: data.providerQuoteId ?? null,
          offer_id: data.offerId ?? null,
          subtotal: data.subtotal,
          discount_amount: data.discountAmount,
          tax_amount: data.taxAmount,
          total_amount: data.totalAmount,
          currency: data.currency,
          scheduled_at: data.scheduledAt ?? null,
          city_id: data.cityId ?? null,
          area_id: data.areaId ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toEntity(row as OrderRow);
    },

    async updateStatus(id, input) {
      const patch: Record<string, unknown> = { status: input.status };
      if (input.cancelledReason !== undefined)
        patch.cancelled_reason = input.cancelledReason;
      if (input.status === "completed")
        patch.completed_at = new Date().toISOString();
      if (input.status === "cancelled")
        patch.cancelled_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as OrderRow) : null;
    },
  };
}
