import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { QuotesRepository } from "./repository";
import { createQuotesService } from "./service";
import type { ListQuoteRequestsParams, QuoteRequest } from "./types";

const sample: QuoteRequest = {
  id: "q1",
  customerId: "u1",
  categoryId: "cat1",
  subCategoryId: null,
  cityId: null,
  areaId: null,
  title: "Need deep cleaning",
  description: null,
  budgetMin: null,
  budgetMax: null,
  currency: "KWD",
  preferredDate: null,
  attachments: [],
  status: "open",
  expiresAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListQuoteRequestsParams = { page: 1, pageSize: 20 };

function fakeRepo(overrides: Partial<QuotesRepository> = {}): QuotesRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("QuotesService", () => {
  it("create() records the customer as owner", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createQuotesService(fakeRepo({ create }));
    await service.create("u1", {
      title: "Need deep cleaning",
      categoryId: "cat1",
      currency: "KWD",
    });
    expect(create).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        title: "Need deep cleaning",
      }),
    );
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createQuotesService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists with a paginated envelope", async () => {
    const service = createQuotesService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
