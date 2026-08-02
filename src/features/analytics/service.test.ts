import { describe, expect, it, vi } from "vitest";

import type { AnalyticsRepository } from "./repository";
import { createAnalyticsService } from "./service";

function fakeRepo(
  overrides: Partial<AnalyticsRepository> = {},
): AnalyticsRepository {
  return {
    adminOverview: vi.fn().mockResolvedValue({ users: 10, providers: 3 }),
    providerOverview: vi.fn().mockResolvedValue({ services: 5, orders: 2 }),
    customerOverview: vi.fn().mockResolvedValue({ orders: 1 }),
    ...overrides,
  };
}

describe("AnalyticsService", () => {
  it("returns admin metrics for an admin", async () => {
    const service = createAnalyticsService(fakeRepo());
    const result = await service.overview({
      role: "admin",
      userId: "u1",
      providerId: null,
    });
    expect(result.scope).toBe("admin");
    expect(result.metrics.users).toBe(10);
  });

  it("returns provider metrics when the caller owns a provider", async () => {
    const providerOverview = vi.fn().mockResolvedValue({ services: 5 });
    const service = createAnalyticsService(fakeRepo({ providerOverview }));
    const result = await service.overview({
      role: "provider",
      userId: "u1",
      providerId: "p1",
    });
    expect(result.scope).toBe("provider");
    expect(providerOverview).toHaveBeenCalledWith("p1");
  });

  it("falls back to customer metrics without a provider profile", async () => {
    const service = createAnalyticsService(fakeRepo());
    const result = await service.overview({
      role: "customer",
      userId: "u1",
      providerId: null,
    });
    expect(result.scope).toBe("customer");
    expect(result.metrics.orders).toBe(1);
  });
});
