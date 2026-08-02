import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { ProvidersRepository } from "./repository";
import { createProvidersService } from "./service";
import type { ListProvidersParams, Provider } from "./types";

const sample: Provider = {
  id: "p1",
  userId: "u1",
  slug: "shiny-clean",
  businessNameEn: "Shiny Clean",
  businessNameAr: "شايني كلين",
  descriptionEn: null,
  descriptionAr: null,
  logoUrl: null,
  coverUrl: null,
  status: "verified",
  isFeatured: true,
  rating: 4.5,
  reviewsCount: 12,
  cityId: null,
  areaId: null,
  commissionRate: 10,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListProvidersParams = {
  page: 1,
  pageSize: 20,
  featured: false,
};

function fakeRepo(
  overrides: Partial<ProvidersRepository> = {},
): ProvidersRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    findBySlug: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("ProvidersService", () => {
  it("lists with a paginated envelope", async () => {
    const service = createProvidersService(
      fakeRepo({
        list: vi.fn().mockResolvedValue({ items: [sample], total: 3 }),
      }),
    );
    const result = await service.list({ ...listParams, pageSize: 2 });
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  it("create() passes the owner user id to the repository", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createProvidersService(fakeRepo({ create }));
    await service.create("u1", {
      slug: "shiny-clean",
      businessNameEn: "Shiny Clean",
      businessNameAr: "شايني كلين",
    });
    expect(create).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        slug: "shiny-clean",
      }),
    );
  });

  it("get() and getBySlug() throw NotFoundError when missing", async () => {
    const service = createProvidersService(
      fakeRepo({
        findById: vi.fn().mockResolvedValue(null),
        findBySlug: vi.fn().mockResolvedValue(null),
      }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getBySlug("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updateAdmin() throws NotFoundError when missing", async () => {
    const service = createProvidersService(
      fakeRepo({ update: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.updateAdmin("x", { status: "verified" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
