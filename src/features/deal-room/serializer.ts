import { formatFilsToKwd } from "./money";
import type { PaymentRequestStatus } from "./types";

/** Domain shape of a payment request — includes provider-eyes-only fields. */
export interface PaymentRequest {
  id: string;
  reference: string;
  conversationId: string;
  title: string;
  note: string | null;
  deliveryText: string | null;
  amountFils: bigint;
  feeRateBps: number;
  feeFils: bigint;
  netFils: bigint;
  currency: string;
  status: PaymentRequestStatus;
  expiresAt: string;
  paidMethod: string | null;
  paidAt: string | null;
  receiptRef: string | null;
}

export type ViewerRole = "customer" | "provider";

/** Wire shape sent to a customer. No commission fields — ever. */
export interface CustomerPaymentRequestView {
  id: string;
  reference: string;
  title: string;
  note: string | null;
  deliveryText: string | null;
  amount: string;
  currency: string;
  status: PaymentRequestStatus;
  expiresAt: string;
  paidMethod: string | null;
  paidAt: string | null;
  receiptRef: string | null;
}

/** Wire shape sent to the issuing provider — adds the gross/fee/net split. */
export type ProviderPaymentRequestView = CustomerPaymentRequestView & {
  feeRateBps: number;
  fee: string;
  net: string;
};

/**
 * Role-based serializer — the single place that decides what a payment
 * request looks like on the wire. This, not RLS, is what keeps `fee_fils` /
 * `net_fils` away from the customer: RLS only guarantees a viewer can read
 * their *own* rows, not which columns of those rows they see.
 */
export function serializePaymentRequest(
  pr: PaymentRequest,
  viewerRole: "customer",
): CustomerPaymentRequestView;
export function serializePaymentRequest(
  pr: PaymentRequest,
  viewerRole: "provider",
): ProviderPaymentRequestView;
export function serializePaymentRequest(
  pr: PaymentRequest,
  viewerRole: ViewerRole,
): CustomerPaymentRequestView | ProviderPaymentRequestView {
  const base: CustomerPaymentRequestView = {
    id: pr.id,
    reference: pr.reference,
    title: pr.title,
    note: pr.note,
    deliveryText: pr.deliveryText,
    amount: formatFilsToKwd(pr.amountFils),
    currency: pr.currency,
    status: pr.status,
    expiresAt: pr.expiresAt,
    paidMethod: pr.paidMethod,
    paidAt: pr.paidAt,
    receiptRef: pr.receiptRef,
  };

  if (viewerRole === "provider") {
    return {
      ...base,
      feeRateBps: pr.feeRateBps,
      fee: formatFilsToKwd(pr.feeFils),
      net: formatFilsToKwd(pr.netFils),
    };
  }
  return base;
}
