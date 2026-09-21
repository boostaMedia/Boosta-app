import { describe, expect, it } from "vitest";

import {
  effectiveStatus,
  monthlyRevenue,
  paidBetween,
  toCsv,
  type Invoice,
} from "./logic";

const base: Invoice = {
  id: "i1",
  providerId: "p1",
  amount: 975,
  currency: "USD",
  status: "due",
  dueAt: "2026-09-10T00:00:00Z",
  paidAt: null,
  paymentMethod: null,
  reference: null,
  createdAt: "2026-08-27T00:00:00Z",
};

const now = new Date("2026-09-21T12:00:00Z");

describe("effectiveStatus", () => {
  it("treats an open invoice past its due date as overdue", () => {
    expect(effectiveStatus(base, now)).toBe("overdue");
  });

  it("keeps an open invoice due before its due date", () => {
    expect(
      effectiveStatus({ ...base, dueAt: "2026-10-01T00:00:00Z" }, now),
    ).toBe("due");
  });

  it("never marks paid or void invoices overdue", () => {
    expect(effectiveStatus({ ...base, status: "paid" }, now)).toBe("paid");
    expect(effectiveStatus({ ...base, status: "void" }, now)).toBe("void");
  });
});

describe("monthlyRevenue", () => {
  const paid = (paidAt: string, amount: number): Invoice => ({
    ...base,
    status: "paid",
    paidAt,
    amount,
  });

  it("returns the last N months oldest first, zero-filled", () => {
    const out = monthlyRevenue([], now, 3);
    expect(out.map((m) => m.month)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(out.every((m) => m.total === 0)).toBe(true);
  });

  it("sums paid invoices into their payment month and ignores the rest", () => {
    const out = monthlyRevenue(
      [
        paid("2026-09-02T00:00:00Z", 975),
        paid("2026-09-15T00:00:00Z", 975),
        paid("2026-08-31T23:00:00Z", 500),
        paid("2025-01-01T00:00:00Z", 999),
        base,
      ],
      now,
      3,
    );
    expect(out).toEqual([
      { month: "2026-07", total: 0 },
      { month: "2026-08", total: 500 },
      { month: "2026-09", total: 1950 },
    ]);
  });

  it("wraps correctly across a year boundary", () => {
    const out = monthlyRevenue([], new Date("2026-02-10T00:00:00Z"), 4);
    expect(out.map((m) => m.month)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("paidBetween", () => {
  it("counts only paid invoices inside the half-open range", () => {
    const inv = (paidAt: string): Invoice => ({
      ...base,
      status: "paid",
      paidAt,
    });
    const total = paidBetween(
      [
        inv("2026-09-01T00:00:00Z"),
        inv("2026-09-30T23:59:59Z"),
        inv("2026-10-01T00:00:00Z"),
        base,
      ],
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-10-01T00:00:00Z"),
    );
    expect(total).toBe(1950);
  });
});

describe("toCsv", () => {
  it("prefixes a BOM and uses CRLF rows", () => {
    const csv = toCsv([["a", 1]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿a,1\r\n");
  });

  it("quotes cells with commas, quotes and newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "x\ny"]])).toBe(
      '﻿"a,b","say ""hi""","x\ny"\r\n',
    );
  });

  it("neutralises spreadsheet formulas in text cells but not numbers", () => {
    const csv = toCsv([['=HYPERLINK("x")', "+1", -5, null]]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+1");
    expect(csv).toContain(",-5,");
  });
});
