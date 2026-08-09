import { describe, expect, it } from "vitest";

import {
  computeFeeFils,
  computeNetFils,
  formatFilsToKwd,
  parseKwdToFils,
} from "./money";

describe("parseKwdToFils", () => {
  it.each([
    ["450.500", BigInt(450500)],
    ["0.001", BigInt(1)],
    ["1000.000", BigInt(1000000)],
    ["1", BigInt(1000)],
    ["0", BigInt(0)],
  ])("parses %s to %s fils", (input, expected) => {
    expect(parseKwdToFils(input)).toBe(expected);
  });

  it("rejects malformed input", () => {
    for (const bad of ["abc", "-1.000", "1.2345", "", "1..0"]) {
      expect(() => parseKwdToFils(bad)).toThrow();
    }
  });
});

describe("formatFilsToKwd", () => {
  it("round-trips parse -> format for 3-decimal input", () => {
    for (const input of ["450.500", "0.001", "1000.000", "1.230"]) {
      expect(formatFilsToKwd(parseKwdToFils(input))).toBe(input);
    }
  });

  it("formats zero and negative values", () => {
    expect(formatFilsToKwd(BigInt(0))).toBe("0.000");
    expect(formatFilsToKwd(BigInt(-1500))).toBe("-1.500");
  });
});

describe("fee math", () => {
  it("20% of 450.500 KWD", () => {
    const amount = parseKwdToFils("450.500");
    const fee = computeFeeFils(amount, 2000);
    expect(fee).toBe(BigInt(90100));
    expect(computeNetFils(amount, fee)).toBe(BigInt(360400));
  });

  it("0% commission yields zero fee and a full net", () => {
    const amount = parseKwdToFils("100.000");
    const fee = computeFeeFils(amount, 0);
    expect(fee).toBe(BigInt(0));
    expect(computeNetFils(amount, fee)).toBe(amount);
  });

  it("truncates rather than rounds", () => {
    // 1 fils at 3.33% truncates to 0, not 0.03 rounded up.
    expect(computeFeeFils(BigInt(1), 333)).toBe(BigInt(0));
  });

  it("rejects an out-of-range rate", () => {
    expect(() => computeFeeFils(BigInt(1000), -1)).toThrow();
    expect(() => computeFeeFils(BigInt(1000), 10001)).toThrow();
  });
});
