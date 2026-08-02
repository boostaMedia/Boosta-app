import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createProviderQuoteSchema,
  PROVIDER_QUOTE_STATUSES,
  updateProviderQuoteSchema,
} from "./schemas";

export type ProviderQuoteStatus = (typeof PROVIDER_QUOTE_STATUSES)[number];

/** Domain entity (camelCase) exposed by the provider-quotes service. */
export interface ProviderQuote {
  id: string;
  quoteRequestId: string;
  providerId: string;
  serviceId: string | null;
  amount: number;
  currency: string;
  message: string | null;
  estimatedDurationMinutes: number | null;
  validUntil: string | null;
  status: ProviderQuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateProviderQuoteInput = z.infer<
  typeof createProviderQuoteSchema
>;
export type UpdateProviderQuoteInput = z.infer<
  typeof updateProviderQuoteSchema
>;

export interface ListProviderQuotesParams extends PaginationQuery {
  quoteRequestId?: string;
  providerId?: string;
  status?: ProviderQuoteStatus;
}
