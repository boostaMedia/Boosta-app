import type { Order } from "./types";

export interface ProviderOrderSummary {
  bookingsThisMonth: number;
  completedTotal: number;
  /** Money from orders completed this month, keyed by currency. */
  revenueThisMonth: { currency: string; amount: number }[];
  /** Pending requests, oldest first (the ones waiting longest). */
  pendingRequests: Order[];
}

/**
 * Headline numbers for a provider's dashboard, from their own orders. Months
 * are UTC calendar months. Revenue counts only completed orders, by the
 * moment they were completed.
 */
export function summarizeProviderOrders(
  orders: Order[],
  now: Date,
): ProviderOrderSummary {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const inThisMonth = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getUTCFullYear() === y && d.getUTCMonth() === m;
  };

  const revenue = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "completed" && inThisMonth(o.completedAt)) {
      revenue.set(o.currency, (revenue.get(o.currency) ?? 0) + o.totalAmount);
    }
  }

  return {
    bookingsThisMonth: orders.filter((o) => inThisMonth(o.createdAt)).length,
    completedTotal: orders.filter((o) => o.status === "completed").length,
    revenueThisMonth: [...revenue].map(([currency, amount]) => ({
      currency,
      amount,
    })),
    pendingRequests: orders
      .filter((o) => o.status === "pending")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  };
}
