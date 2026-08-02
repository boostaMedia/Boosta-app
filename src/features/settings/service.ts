import { NotFoundError } from "@/lib/errors";

import type { SettingsRepository } from "./repository";
import type { Setting, UpsertSettingInput } from "./types";

export interface SettingsService {
  list(): Promise<Setting[]>;
  get(key: string): Promise<Setting>;
  upsert(key: string, input: UpsertSettingInput): Promise<Setting>;
}

export function createSettingsService(
  repo: SettingsRepository,
): SettingsService {
  return {
    async list() {
      return repo.list();
    },

    async get(key) {
      const setting = await repo.findByKey(key);
      if (!setting) throw new NotFoundError("Setting not found.");
      return setting;
    },

    async upsert(key, input) {
      return repo.upsert(key, input);
    },
  };
}
