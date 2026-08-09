import { describe, expect, it } from "vitest";

import { type PaymentRequest, serializePaymentRequest } from "./serializer";

const sample: PaymentRequest = {
  id: "pr1",
  reference: "PR-1001",
  conversationId: "c1",
  title: "Logo design deposit",
  note: null,
  deliveryText: "10 working days",
  amountFils: BigInt(450500),
  feeRateBps: 2000,
  feeFils: BigInt(90100),
  netFils: BigInt(360400),
  currency: "KWD",
  status: "sent",
  expiresAt: "2026-08-11T00:00:00Z",
  paidMethod: null,
  paidAt: null,
  receiptRef: null,
};

describe("serializePaymentRequest", () => {
  it("customer view contains no fee/net keys", () => {
    const view = serializePaymentRequest(sample, "customer");
    const keys = Object.keys(view);
    expect(keys.some((k) => /fee/i.test(k) || /net/i.test(k))).toBe(false);
    expect(view.amount).toBe("450.500");
  });

  it("provider view includes the gross/fee/net split", () => {
    const view = serializePaymentRequest(sample, "provider");
    expect(view.amount).toBe("450.500");
    expect(view.fee).toBe("90.100");
    expect(view.net).toBe("360.400");
    expect(view.feeRateBps).toBe(2000);
  });

  it("never leaks bigint fields onto either view", () => {
    const customerView = serializePaymentRequest(sample, "customer");
    const providerView = serializePaymentRequest(sample, "provider");
    for (const value of Object.values(customerView)) {
      expect(typeof value).not.toBe("bigint");
    }
    for (const value of Object.values(providerView)) {
      expect(typeof value).not.toBe("bigint");
    }
  });
});
