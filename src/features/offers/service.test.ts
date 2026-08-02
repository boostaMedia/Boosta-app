import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { OffersRepository } from "./repository";
import { createOffersService } from "./service";
import type { ListOffersParams, Offer } from "./types";

const sample: Offer = {
  id: "o1",
  providerId: "p1",
  serviceId: null,
  titleEn: "Ramadan Offer",
  titleAr: "عرض رمضان",
  descriptionEn: null,
  descriptionAr: null,
  discountType: "percentage",
  discountValue: 20,
  originalPrice: null,
  finalPrice: null,
  currency: "KWD",
  startsAt: "2026-01-01T00:00:00Z",
  endsAt: null,
  status: "active",
  maxRedemptions: null,
  redemptionsCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListOffersParams = { page: 1, pageSize: 20 };

function fakeRepo(overrides: Partial<OffersRepository> = {}): OffersRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    update: vi.fn().mockResolvedValue(sample),
    softDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("OffersService", () => {
  it("lists with a paginated envelope", async () => {
    const service = createOffersService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });

  it("create() binds the offer to the provider id", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createOffersService(fakeRepo({ create }));
    await service.create("p1", {
      titleEn: "Ramadan Offer",
      titleAr: "عرض رمضان",
      discountType: "percentage",
      discountValue: 20,
      currency: "KWD",
      status: "active",
    });
    expect(create).toHaveBeenCalledWith("p1", expect.any(Object));
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createOffersService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });
});
