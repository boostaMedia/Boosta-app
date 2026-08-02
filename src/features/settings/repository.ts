import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import type { settingRowSchema } from "./schemas";
import type { Setting, UpsertSettingInput } from "./types";

type SettingRow = z.infer<typeof settingRowSchema>;

const TABLE = "settings";

function toEntity(row: SettingRow): Setting {
  return {
    key: row.key,
    value: row.value,
    description: row.description,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
  };
}

export interface SettingsRepository {
  list(): Promise<Setting[]>;
  findByKey(key: string): Promise<Setting | null>;
  upsert(key: string, input: UpsertSettingInput): Promise<Setting>;
}

export function createSettingsRepository(
  supabase: SupabaseClient,
): SettingsRepository {
  return {
    async list() {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("key", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as SettingRow[]).map(toEntity);
    },

    async findByKey(key) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("key", key)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as SettingRow) : null;
    },

    async upsert(key, input) {
      const row: Record<string, unknown> = { key, value: input.value ?? null };
      if (input.description !== undefined) row.description = input.description;
      if (input.isPublic !== undefined) row.is_public = input.isPublic;

      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "key" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toEntity(data as SettingRow);
    },
  };
}
