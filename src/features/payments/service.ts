import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { PaymentsRepository } from "./repository";
import type { ListPaymentsParams, Payment } from "./types";

/**
 * Payments business logic. Read-only through the public API — payment records
 * are created and mutated server-side by the gateway/webhook flow (a later
 * phase) using the service role. Visibility (payer / provider / admin) is
 * enforced by RLS.
 */
export interface PaymentsService {
  list(params: ListPaymentsParams): Promise<Paginated<Payment>>;
  get(id: string): Promise<Payment>;
}

export function createPaymentsService(
  repo: PaymentsRepository,
): PaymentsService {
  return {
    async list(params) {
      const { items, total } = await repo.list(params);
      return {
        items,
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      };
    },

    async get(id) {
      const payment = await repo.findById(id);
      if (!payment) throw new NotFoundError("Payment not found.");
      return payment;
    },
  };
}
