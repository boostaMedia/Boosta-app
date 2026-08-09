import { describe, expect, it } from "vitest";

import { assertTransition, canTransition } from "./status";

describe("payment request status transitions", () => {
  it("allows the happy path: draft -> sent -> paid -> refunded", () => {
    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("sent", "paid")).toBe(true);
    expect(canTransition("paid", "refunded")).toBe(true);
  });

  it("allows sent -> expired and sent -> cancelled", () => {
    expect(canTransition("sent", "expired")).toBe(true);
    expect(canTransition("sent", "cancelled")).toBe(true);
  });

  it("rejects every illegal edge", () => {
    expect(canTransition("paid", "sent")).toBe(false);
    expect(canTransition("expired", "paid")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(canTransition("expired", "sent")).toBe(false);
    expect(canTransition("cancelled", "sent")).toBe(false);
    expect(canTransition("refunded", "paid")).toBe(false);
    expect(canTransition("draft", "paid")).toBe(false);
  });

  it("assertTransition throws on an illegal transition", () => {
    expect(() => assertTransition("paid", "sent")).toThrow();
  });

  it("assertTransition returns the target status on success", () => {
    expect(assertTransition("sent", "paid")).toBe("paid");
  });
});
