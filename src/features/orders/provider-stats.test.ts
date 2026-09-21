import { describe, expect, it } from "vitest";

import { summarizeProviderOrders } from "./provider-stats";
import type { Order } from "./types";

const base: Order = {
  id: "o1",
  orderNumber: "BM-1",
  customerId: "c1",
  providerId: "p1",
  serviceId: "s1",
  providerQuoteId: null,
  offerId: null,
  status: "pending",
  subtotal: 100,
  discountAmount: 0,
  taxAmount: 0,
  commissionAmount: 0,
  totalAmount: 100,
  currency: "KWD",
  scheduledAt: null,
  cityId: null,
  areaId: null,
  address: null,
  notes: null,
  cancelledReason: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-10T00:00:00Z",
  updatedAt: "2026-09-10T00:00:00Z",
};

const now = new Date("2026-09-21T12:00:00Z");

describe("summarizeProviderOrders", () => {
  it("counts bookings created this month only", () => {
    const out = summarizeProviderOrders(
      [base, { ...base, id: "o2", createdAt: "2026-08-31T23:00:00Z" }],
      now,
    );
    expect(out.bookingsThisMonth).toBe(1);
  });

  it("sums revenue from orders completed this month, per currency", () => {
    const done = (id: string, total: number, currency: string, at: string) => ({
      ...base,
      id,
      status: "completed" as const,
      totalAmount: total,
      currency,
      completedAt: at,
    });
    const out = summarizeProviderOrders(
      [
        done("a", 100, "KWD", "2026-09-05T00:00:00Z"),
        done("b", 50, "KWD", "2026-09-20T00:00:00Z"),
        done("c", 70, "SAR", "2026-09-02T00:00:00Z"),
        done("d", 999, "KWD", "2026-08-30T00:00:00Z"),
        { ...base, id: "e", totalAmount: 500 },
      ],
      now,
    );
    expect(out.revenueThisMonth).toEqual([
      { currency: "KWD", amount: 150 },
      { currency: "SAR", amount: 70 },
    ]);
    expect(out.completedTotal).toBe(4);
  });

  it("lists pending requests oldest first and ignores other statuses", () => {
    const out = summarizeProviderOrders(
      [
        { ...base, id: "new", createdAt: "2026-09-20T00:00:00Z" },
        { ...base, id: "old", createdAt: "2026-09-01T00:00:00Z" },
        { ...base, id: "conf", status: "confirmed" },
      ],
      now,
    );
    expect(out.pendingRequests.map((o) => o.id)).toEqual(["old", "new"]);
  });
});
