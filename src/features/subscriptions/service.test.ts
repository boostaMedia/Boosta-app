import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { SubscriptionsRepository } from "./repository";
import { createSubscriptionsService, periodEndFrom } from "./service";
import type { ProviderPackage, Subscription } from "./types";

const annualPlan: ProviderPackage = {
  id: "pkg-annual",
  slug: "annual",
  nameEn: "Annual",
  nameAr: "سنوي",
  descriptionEn: null,
  descriptionAr: null,
  price: 250,
  currency: "KWD",
  billingInterval: "yearly",
  features: [],
  maxServices: null,
  maxOffers: null,
  isActive: true,
  sortOrder: 4,
};

const subscription: Subscription = {
  id: "sub1",
  providerId: "p1",
  packageId: "pkg-annual",
  status: "active",
  startedAt: "2026-01-01T00:00:00Z",
  currentPeriodStart: "2026-01-01T00:00:00Z",
  currentPeriodEnd: "2027-01-01T00:00:00Z",
  cancelAt: null,
  cancelledAt: null,
  autoRenew: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function fakeRepo(
  overrides: Partial<SubscriptionsRepository> = {},
): SubscriptionsRepository {
  return {
    listPackages: vi.fn().mockResolvedValue([annualPlan]),
    findPackage: vi.fn().mockResolvedValue(annualPlan),
    listSubscriptions: vi.fn().mockResolvedValue([subscription]),
    findSubscription: vi.fn().mockResolvedValue(subscription),
    create: vi.fn().mockResolvedValue(subscription),
    update: vi.fn().mockResolvedValue(subscription),
    ...overrides,
  };
}

describe("periodEndFrom", () => {
  it("adds one year for a yearly plan (the 250 KWD annual plan)", () => {
    const start = new Date("2026-02-01T00:00:00Z");
    expect(periodEndFrom("yearly", start).toISOString()).toBe(
      "2027-02-01T00:00:00.000Z",
    );
  });

  it("adds one month for a monthly plan", () => {
    const start = new Date("2026-02-01T00:00:00Z");
    expect(periodEndFrom("monthly", start).getUTCMonth()).toBe(2); // March
  });
});

describe("SubscriptionsService", () => {
  it("subscribe() computes the period end from the plan interval", async () => {
    const create = vi.fn().mockResolvedValue(subscription);
    const service = createSubscriptionsService(fakeRepo({ create }));
    await service.subscribe("p1", { packageId: "pkg-annual", autoRenew: true });
    const data = create.mock.calls[0][1];
    expect(data.packageId).toBe("pkg-annual");
    expect(typeof data.currentPeriodEnd).toBe("string");
  });

  it("subscribe() throws NotFoundError for an unknown plan", async () => {
    const service = createSubscriptionsService(
      fakeRepo({ findPackage: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.subscribe("p1", { packageId: "x", autoRenew: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update() with cancel sets a cancelled status", async () => {
    const update = vi.fn().mockResolvedValue(subscription);
    const service = createSubscriptionsService(fakeRepo({ update }));
    await service.update("sub1", { cancel: true });
    expect(update).toHaveBeenCalledWith(
      "sub1",
      expect.objectContaining({ status: "cancelled", autoRenew: false }),
    );
  });
});
