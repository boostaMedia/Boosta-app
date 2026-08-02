import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  paymentRowSchema,
} from "./schemas";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Domain entity (camelCase). Excludes the internal gateway payload. */
export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  providerId: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gateway: string;
  gatewayReference: string | null;
  refundedAmount: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentRow = z.infer<typeof paymentRowSchema>;

export interface ListPaymentsParams extends PaginationQuery {
  orderId?: string;
  status?: PaymentStatus;
}
