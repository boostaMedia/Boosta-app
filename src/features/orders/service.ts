import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { OrdersRepository } from "./repository";
import type {
  CreateOrderInput,
  ListOrdersParams,
  Order,
  UpdateOrderStatusInput,
} from "./types";

/**
 * Orders business logic. Computes the order total from its components and owns
 * not-found semantics. Participant visibility (customer + provider) is enforced
 * by RLS.
 */
export interface OrdersService {
  list(params: ListOrdersParams): Promise<Paginated<Order>>;
  get(id: string): Promise<Order>;
  create(customerId: string, input: CreateOrderInput): Promise<Order>;
  updateStatus(id: string, input: UpdateOrderStatusInput): Promise<Order>;
}

export function createOrdersService(repo: OrdersRepository): OrdersService {
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
      const order = await repo.findById(id);
      if (!order) throw new NotFoundError("Order not found.");
      return order;
    },

    async create(customerId, input) {
      const totalAmount = Math.max(
        0,
        input.subtotal - input.discountAmount + input.taxAmount,
      );
      return repo.create(customerId, { ...input, totalAmount });
    },

    async updateStatus(id, input) {
      const updated = await repo.updateStatus(id, input);
      if (!updated) throw new NotFoundError("Order not found.");
      return updated;
    },
  };
}
