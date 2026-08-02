import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { SettingsRepository } from "./repository";
import { createSettingsService } from "./service";
import type { Setting } from "./types";

const sample: Setting = {
  key: "default_currency",
  value: "KWD",
  description: null,
  isPublic: true,
  updatedAt: "2026-01-01T00:00:00Z",
};

function fakeRepo(
  overrides: Partial<SettingsRepository> = {},
): SettingsRepository {
  return {
    list: vi.fn().mockResolvedValue([sample]),
    findByKey: vi.fn().mockResolvedValue(sample),
    upsert: vi.fn().mockResolvedValue(sample),
    ...overrides,
  };
}

describe("SettingsService", () => {
  it("lists settings", async () => {
    const service = createSettingsService(fakeRepo());
    await expect(service.list()).resolves.toHaveLength(1);
  });

  it("get() throws NotFoundError for an unknown key", async () => {
    const service = createSettingsService(
      fakeRepo({ findByKey: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("upsert() delegates to the repository", async () => {
    const upsert = vi.fn().mockResolvedValue(sample);
    const service = createSettingsService(fakeRepo({ upsert }));
    await service.upsert("default_currency", { value: "KWD" });
    expect(upsert).toHaveBeenCalledWith("default_currency", { value: "KWD" });
  });
});
