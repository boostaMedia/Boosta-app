import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { CategoriesRepository } from "./repository";
import { createCategoriesService } from "./service";
import type { Category, ListCategoriesParams } from "./types";

const sample: Category = {
  id: "c1",
  slug: "cleaning",
  nameEn: "Cleaning",
  nameAr: "تنظيف",
  descriptionEn: null,
  descriptionAr: null,
  icon: null,
  imageUrl: null,
  isActive: true,
  sortOrder: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListCategoriesParams = {
  page: 1,
  pageSize: 20,
  activeOnly: false,
};

function fakeRepo(
  overrides: Partial<CategoriesRepository> = {},
): CategoriesRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("CategoriesService", () => {
  it("returns a paginated envelope with computed totalPages", async () => {
    const service = createCategoriesService(
      fakeRepo({
        list: vi.fn().mockResolvedValue({ items: [sample], total: 42 }),
      }),
    );

    const result = await service.list({ ...listParams, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(42);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it("get() returns the category when found", async () => {
    const service = createCategoriesService(fakeRepo());
    await expect(service.get("c1")).resolves.toEqual(sample);
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createCategoriesService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("create() delegates to the repository", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createCategoriesService(fakeRepo({ create }));

    await service.create({
      slug: "cleaning",
      nameEn: "Cleaning",
      nameAr: "تنظيف",
      isActive: true,
      sortOrder: 1,
    });

    expect(create).toHaveBeenCalledOnce();
  });

  it("update() throws NotFoundError when the row does not exist", async () => {
    const service = createCategoriesService(
      fakeRepo({ update: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.update("missing", { nameEn: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove() throws NotFoundError when nothing was deleted", async () => {
    const service = createCategoriesService(
      fakeRepo({ softDelete: vi.fn().mockResolvedValue(false) }),
    );
    await expect(service.remove("missing")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
