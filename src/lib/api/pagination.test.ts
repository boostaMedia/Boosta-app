import { describe, expect, it } from "vitest";

import { paginate, paginationQuerySchema, rangeFor } from "./pagination";

describe("pagination", () => {
  it("applies defaults when params are absent", () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces string params to numbers", () => {
    const parsed = paginationQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
  });

  it("rejects a pageSize above the maximum", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: "101" })).toThrow();
  });

  it("computes the inclusive row range", () => {
    expect(rangeFor({ page: 1, pageSize: 20 })).toEqual({ from: 0, to: 19 });
    expect(rangeFor({ page: 3, pageSize: 20 })).toEqual({ from: 40, to: 59 });
  });

  it("builds a paginated envelope with totalPages", () => {
    const result = paginate([1, 2, 3], 55, { page: 2, pageSize: 20 });
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(55);
    expect(result.page).toBe(2);
  });

  it("always reports at least one page", () => {
    const result = paginate([], 0, { page: 1, pageSize: 20 });
    expect(result.totalPages).toBe(1);
  });
});
