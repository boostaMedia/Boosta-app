export const PAYMENT_REQUEST_STATUSES = [
  "draft",
  "sent",
  "paid",
  "expired",
  "cancelled",
  "refunded",
] as const;

export type PaymentRequestStatus = (typeof PAYMENT_REQUEST_STATUSES)[number];
