import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createQuoteRequestSchema,
  QUOTE_REQUEST_STATUSES,
  updateQuoteRequestSchema,
} from "./schemas";

export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUSES)[number];

/** Domain entity (camelCase) exposed by the quotes service. */
export interface QuoteRequest {
  id: string;
  customerId: string;
  categoryId: string;
  subCategoryId: string | null;
  cityId: string | null;
  areaId: string | null;
  title: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  preferredDate: string | null;
  attachments: unknown[];
  status: QuoteRequestStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type UpdateQuoteRequestInput = z.infer<typeof updateQuoteRequestSchema>;

export interface ListQuoteRequestsParams extends PaginationQuery {
  status?: QuoteRequestStatus;
  categoryId?: string;
}
