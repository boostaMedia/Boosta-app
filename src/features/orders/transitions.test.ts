import { describe, expect, it } from "vitest";

import { canTransition, nextStatuses, tabForStatus } from "./transitions";

describe("canTransition", () => {
  it("lets a customer withdraw a pending or confirmed booking", () => {
    expect(canTransition("customer", "pending", "cancelled")).toBe(true);
    expect(canTransition("customer", "confirmed", "cancelled")).toBe(true);
  });

  it("stops a customer from advancing or completing their own booking", () => {
    expect(canTransition("customer", "pending", "confirmed")).toBe(false);
    expect(canTransition("customer", "in_progress", "completed")).toBe(false);
    expect(canTransition("customer", "in_progress", "cancelled")).toBe(false);
  });

  it("lets a provider accept, decline, start and complete in order", () => {
    expect(canTransition("provider", "pending", "confirmed")).toBe(true);
    expect(canTransition("provider", "pending", "cancelled")).toBe(true);
    expect(canTransition("provider", "confirmed", "in_progress")).toBe(true);
    expect(canTransition("provider", "in_progress", "completed")).toBe(true);
  });

  it("does not let a provider skip steps or reopen finished orders", () => {
    expect(canTransition("provider", "pending", "completed")).toBe(false);
    expect(canTransition("provider", "completed", "in_progress")).toBe(false);
    expect(canTransition("provider", "cancelled", "confirmed")).toBe(false);
  });
});

describe("nextStatuses", () => {
  it("is empty for a terminal status", () => {
    expect(nextStatuses("provider", "completed")).toEqual([]);
    expect(nextStatuses("customer", "cancelled")).toEqual([]);
  });
});

describe("tabForStatus", () => {
  it("groups statuses into the three booking tabs", () => {
    expect(tabForStatus("pending")).toBe("upcoming");
    expect(tabForStatus("in_progress")).toBe("upcoming");
    expect(tabForStatus("completed")).toBe("completed");
    expect(tabForStatus("refunded")).toBe("cancelled");
  });
});
