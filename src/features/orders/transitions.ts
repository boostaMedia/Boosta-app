import type { OrderStatus } from "./types";

export type OrderActor = "customer" | "provider";

/**
 * Which status changes each side of an order may make. The customer can only
 * withdraw a booking; the provider drives it forward (accept → start →
 * complete) or declines/cancels it. Anything else — refunds, disputes, skipping
 * steps — is not available from the booking UI.
 */
const ALLOWED: Record<
  OrderActor,
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  customer: {
    pending: ["cancelled"],
    confirmed: ["cancelled"],
  },
  provider: {
    pending: ["confirmed", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["completed"],
  },
};

export function canTransition(
  actor: OrderActor,
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ALLOWED[actor][from]?.includes(to) ?? false;
}

/** Next statuses an actor may choose from the given status. */
export function nextStatuses(
  actor: OrderActor,
  from: OrderStatus,
): OrderStatus[] {
  return ALLOWED[actor][from] ?? [];
}

/** Bucket used by the customer's "My bookings" tabs. */
export type BookingTab = "upcoming" | "completed" | "cancelled";

export function tabForStatus(status: OrderStatus): BookingTab {
  if (status === "completed") return "completed";
  if (status === "cancelled" || status === "refunded") return "cancelled";
  return "upcoming";
}
