import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { BusinessListingsRepository } from "./repository";
import { createBusinessListingsService } from "./service";
import type { BusinessListing, ListBusinessListingsParams } from "./types";

const sample: BusinessListing = {
  id: "b1",
  providerId: "p1",
  slug: "established-cafe",
  titleEn: "Established Cafe in Salmiya",
  titleAr: "مقهى قائم في السالمية",
  descriptionEn: null,
  descriptionAr: null,
  industryEn: "Food & Beverage",
  industryAr: "الأغذية والمشروبات",
  askingPrice: 45000,
  currency: "KWD",
  monthlyRevenue: 3000,
  establishedYear: 2021,
  cityId: null,
  status: "active",
  isFeatured: true,
  viewsCount: 12,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListBusinessListingsParams = {
  page: 1,
  pageSize: 20,
  featuredOnly: false,
};

function fakeRepo(
  overrides: Partial<BusinessListingsRepository> = {},
): BusinessListingsRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("BusinessListingsService", () => {
  it("lists with a paginated envelope", async () => {
    const service = createBusinessListingsService(
      fakeRepo({
        list: vi.fn().mockResolvedValue({ items: [sample], total: 3 }),
      }),
    );
    const result = await service.list({ ...listParams, pageSize: 2 });
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  it("create() passes the owning provider id to the repository", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createBusinessListingsService(fakeRepo({ create }));
    await service.create("p1", {
      slug: "established-cafe",
      titleEn: "Established Cafe in Salmiya",
      titleAr: "مقهى قائم في السالمية",
      askingPrice: 45000,
      currency: "KWD",
      status: "draft",
    });
    expect(create).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ slug: "established-cafe" }),
    );
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createBusinessListingsService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update() throws NotFoundError when missing", async () => {
    const service = createBusinessListingsService(
      fakeRepo({ update: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.update("x", { titleEn: "New title" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove() throws NotFoundError when missing", async () => {
    const service = createBusinessListingsService(
      fakeRepo({ softDelete: vi.fn().mockResolvedValue(false) }),
    );
    await expect(service.remove("x")).rejects.toBeInstanceOf(NotFoundError);
  });
});
