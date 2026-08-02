import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { ProviderQuotesRepository } from "./repository";
import { createProviderQuotesService } from "./service";
import type { ListProviderQuotesParams, ProviderQuote } from "./types";

const sample: ProviderQuote = {
  id: "pq1",
  quoteRequestId: "q1",
  providerId: "p1",
  serviceId: null,
  amount: 25,
  currency: "KWD",
  message: null,
  estimatedDurationMinutes: null,
  validUntil: null,
  status: "submitted",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListProviderQuotesParams = { page: 1, pageSize: 20 };

function fakeRepo(
  overrides: Partial<ProviderQuotesRepository> = {},
): ProviderQuotesRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    ...overrides,
  };
}

describe("ProviderQuotesService", () => {
  it("create() binds the quote to the provider id", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createProviderQuotesService(fakeRepo({ create }));
    await service.create("p1", {
      quoteRequestId: "q1",
      amount: 25,
      currency: "KWD",
    });
    expect(create).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        quoteRequestId: "q1",
      }),
    );
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createProviderQuotesService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update() throws NotFoundError when missing", async () => {
    const service = createProviderQuotesService(
      fakeRepo({ update: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.update("x", { status: "withdrawn" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists with a paginated envelope", async () => {
    const service = createProviderQuotesService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
