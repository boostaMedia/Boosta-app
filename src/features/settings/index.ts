import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createSettingsRepository } from "./repository";
import { createSettingsService, type SettingsService } from "./service";

/** Build a settings service bound to the request's Supabase client. */
export async function getSettingsService(): Promise<SettingsService> {
  const supabase = await createClient();
  return createSettingsService(createSettingsRepository(supabase));
}

export { settingKeySchema, upsertSettingSchema } from "./schemas";
export type { Setting } from "./types";
export type { SettingsService } from "./service";
