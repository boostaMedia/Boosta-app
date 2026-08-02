import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { ServicesRepository } from "./repository";
import { createServicesService } from "./service";
import type { ListServicesParams, Service } from "./types";

const sample: Service = {
  id: "s1",
  providerId: "p1",
  categoryId: "cat1",
  subCategoryId: null,
  slug: "deep-clean",
  titleEn: "Deep Clean",
  titleAr: "تنظيف عميق",
  descriptionEn: null,
  descriptionAr: null,
  basePrice: 15,
  currency: "KWD",
  priceType: "fixed",
  durationMinutes: 120,
  status: "active",
  isFeatured: false,
  rating: 0,
  reviewsCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListServicesParams = { page: 1, pageSize: 20 };

function fakeRepo(
  overrides: Partial<ServicesRepository> = {},
): ServicesRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("ServicesService", () => {
  it("lists with a paginated envelope", async () => {
    const service = createServicesService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });

  it("create() binds the service to the provider id", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createServicesService(fakeRepo({ create }));
    await service.create("p1", {
      categoryId: "cat1",
      slug: "deep-clean",
      titleEn: "Deep Clean",
      titleAr: "تنظيف عميق",
      basePrice: 15,
      currency: "KWD",
      priceType: "fixed",
      status: "active",
    });
    expect(create).toHaveBeenCalledWith("p1", expect.any(Object));
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createServicesService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove() throws NotFoundError when nothing deleted", async () => {
    const service = createServicesService(
      fakeRepo({ softDelete: vi.fn().mockResolvedValue(false) }),
    );
    await expect(service.remove("x")).rejects.toBeInstanceOf(NotFoundError);
  });
});
