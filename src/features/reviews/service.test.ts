import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { ReviewsRepository } from "./repository";
import { createReviewsService } from "./service";
import type { ListReviewsParams, Review } from "./types";

const sample: Review = {
  id: "r1",
  orderId: null,
  providerId: "p1",
  serviceId: null,
  customerId: "u1",
  rating: 5,
  title: "Great",
  comment: "Excellent service",
  status: "published",
  providerReply: null,
  providerRepliedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListReviewsParams = { page: 1, pageSize: 20 };

function fakeRepo(
  overrides: Partial<ReviewsRepository> = {},
): ReviewsRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    reply: vi.fn().mockResolvedValue({ ...sample, providerReply: "Thanks!" }),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("ReviewsService", () => {
  it("create() records the customer as author", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createReviewsService(fakeRepo({ create }));
    await service.create("u1", { providerId: "p1", rating: 5 });
    expect(create).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        providerId: "p1",
        rating: 5,
      }),
    );
  });

  it("reply() sets the provider reply", async () => {
    const service = createReviewsService(fakeRepo());
    const result = await service.reply("r1", "Thanks!");
    expect(result.providerReply).toBe("Thanks!");
  });

  it("reply() throws NotFoundError when the review is missing", async () => {
    const service = createReviewsService(
      fakeRepo({ reply: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.reply("x", "hi")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("lists with a paginated envelope", async () => {
    const service = createReviewsService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.total).toBe(1);
  });
});
