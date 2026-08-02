import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { OrdersRepository } from "./repository";
import { createOrdersService } from "./service";
import type { CreateOrderData, ListOrdersParams, Order } from "./types";

const sample: Order = {
  id: "ord1",
  orderNumber: "BM-00000001",
  customerId: "u1",
  providerId: "p1",
  serviceId: null,
  providerQuoteId: null,
  offerId: null,
  status: "pending",
  subtotal: 20,
  discountAmount: 5,
  taxAmount: 1,
  commissionAmount: 0,
  totalAmount: 16,
  currency: "KWD",
  scheduledAt: null,
  cityId: null,
  areaId: null,
  address: null,
  notes: null,
  cancelledReason: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const listParams: ListOrdersParams = { page: 1, pageSize: 20 };

function fakeRepo(overrides: Partial<OrdersRepository> = {}): OrdersRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    findById: vi.fn().mockResolvedValue(sample),
    create: vi.fn().mockResolvedValue(sample),
    updateStatus: vi.fn().mockResolvedValue(sample),
    ...overrides,
  };
}

describe("OrdersService", () => {
  it("computes the total from subtotal - discount + tax", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createOrdersService(fakeRepo({ create }));
    await service.create("u1", {
      providerId: "p1",
      subtotal: 20,
      discountAmount: 5,
      taxAmount: 1,
      currency: "KWD",
    });
    const passed = create.mock.calls[0][1] as CreateOrderData;
    expect(passed.totalAmount).toBe(16);
  });

  it("never computes a negative total", async () => {
    const create = vi.fn().mockResolvedValue(sample);
    const service = createOrdersService(fakeRepo({ create }));
    await service.create("u1", {
      providerId: "p1",
      subtotal: 5,
      discountAmount: 20,
      taxAmount: 0,
      currency: "KWD",
    });
    const passed = create.mock.calls[0][1] as CreateOrderData;
    expect(passed.totalAmount).toBe(0);
  });

  it("get() throws NotFoundError when missing", async () => {
    const service = createOrdersService(
      fakeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updateStatus() throws NotFoundError when missing", async () => {
    const service = createOrdersService(
      fakeRepo({ updateStatus: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.updateStatus("x", { status: "confirmed" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists with a paginated envelope", async () => {
    const service = createOrdersService(fakeRepo());
    const result = await service.list(listParams);
    expect(result.total).toBe(1);
  });
});
