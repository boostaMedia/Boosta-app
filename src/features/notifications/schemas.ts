import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const NOTIFICATION_TYPES = [
  "order",
  "quote",
  "message",
  "review",
  "payment",
  "system",
  "promotion",
] as const;

export const NOTIFICATION_CHANNELS = [
  "in_app",
  "email",
  "sms",
  "push",
  "whatsapp",
] as const;

/** Shape of a `public.notifications` row from Supabase (snake_case). */
export const notificationRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  channel: z.enum(NOTIFICATION_CHANNELS),
  title_en: z.string(),
  title_ar: z.string(),
  body_en: z.string().nullable(),
  body_ar: z.string().nullable(),
  data: z.record(z.string(), z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
