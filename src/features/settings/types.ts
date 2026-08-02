import type { z } from "zod";

import type { upsertSettingSchema } from "./schemas";

/** Domain entity (camelCase) exposed by the settings service. */
export interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
}

export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
