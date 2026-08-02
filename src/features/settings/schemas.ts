import { z } from "zod";

/** Shape of a `public.settings` row from Supabase (snake_case). */
export const settingRowSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  description: z.string().nullable(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const settingKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_]+$/, "must be a lowercase snake_case key");

export const upsertSettingSchema = z.object({
  value: z.unknown(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});
