import type { PaymentRequestStatus } from "./types";

/**
 * The payment request state machine:
 *
 *   draft ──▶ sent ──▶ paid ──▶ refunded
 *                │
 *                ├──▶ expired      (lazy, on read)
 *                └──▶ cancelled    (provider, only while sent)
 *
 * `paid` is terminal except for an admin-initiated refund. Only the webhook
 * handler may ever write `paid` — this helper just enforces which edges are
 * legal in principle; who is allowed to invoke them is a separate check.
 */
const ALLOWED_TRANSITIONS: Record<
  PaymentRequestStatus,
  readonly PaymentRequestStatus[]
> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "expired", "cancelled"],
  paid: ["refunded"],
  expired: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(
  from: PaymentRequestStatus,
  to: PaymentRequestStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Throws on an illegal transition; otherwise returns the target status. */
export function assertTransition(
  from: PaymentRequestStatus,
  to: PaymentRequestStatus,
): PaymentRequestStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal payment request transition: ${from} -> ${to}`);
  }
  return to;
}
