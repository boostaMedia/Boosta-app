import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createOrderSchema,
  ORDER_STATUSES,
  updateOrderStatusSchema,
} from "./schemas";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Domain entity (camelCase) exposed by the orders service. */
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  providerQuoteId: string | null;
  offerId: string | null;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  commissionAmount: number;
  totalAmount: number;
  currency: string;
  scheduledAt: string | null;
  cityId: string | null;
  areaId: string | null;
  address: string | null;
  notes: string | null;
  cancelledReason: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Create input after the service has computed the total. */
export type CreateOrderData = CreateOrderInput & { totalAmount: number };

export interface ListOrdersParams extends PaginationQuery {
  status?: OrderStatus;
}
