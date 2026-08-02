import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { QuotesRepository } from "./repository";
import type {
  CreateQuoteRequestInput,
  ListQuoteRequestsParams,
  QuoteRequest,
  UpdateQuoteRequestInput,
} from "./types";

/**
 * Quote-requests business logic. Visibility is enforced by RLS: a customer sees
 * their own requests, a provider sees open requests to bid on.
 */
export interface QuotesService {
  list(params: ListQuoteRequestsParams): Promise<Paginated<QuoteRequest>>;
  get(id: string): Promise<QuoteRequest>;
  create(
    customerId: string,
    input: CreateQuoteRequestInput,
  ): Promise<QuoteRequest>;
  update(id: string, input: UpdateQuoteRequestInput): Promise<QuoteRequest>;
  remove(id: string): Promise<void>;
}

export function createQuotesService(repo: QuotesRepository): QuotesService {
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
      const quote = await repo.findById(id);
      if (!quote) throw new NotFoundError("Quote request not found.");
      return quote;
    },

    async create(customerId, input) {
      return repo.create(customerId, input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Quote request not found.");
      return updated;
    },

    async remove(id) {
      const deleted = await repo.softDelete(id);
      if (!deleted) throw new NotFoundError("Quote request not found.");
    },
  };
}
