import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { ProviderQuotesRepository } from "./repository";
import type {
  CreateProviderQuoteInput,
  ListProviderQuotesParams,
  ProviderQuote,
  UpdateProviderQuoteInput,
} from "./types";

export interface ProviderQuotesService {
  list(params: ListProviderQuotesParams): Promise<Paginated<ProviderQuote>>;
  get(id: string): Promise<ProviderQuote>;
  create(
    providerId: string,
    input: CreateProviderQuoteInput,
  ): Promise<ProviderQuote>;
  update(id: string, input: UpdateProviderQuoteInput): Promise<ProviderQuote>;
}

export function createProviderQuotesService(
  repo: ProviderQuotesRepository,
): ProviderQuotesService {
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
      if (!quote) throw new NotFoundError("Provider quote not found.");
      return quote;
    },

    async create(providerId, input) {
      return repo.create(providerId, input);
    },

    async update(id, input) {
      const updated = await repo.update(id, input);
      if (!updated) throw new NotFoundError("Provider quote not found.");
      return updated;
    },
  };
}
