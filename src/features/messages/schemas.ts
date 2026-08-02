import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";

export const CONVERSATION_STATUSES = ["open", "closed", "archived"] as const;

/** Shape of a `public.conversations` row from Supabase (snake_case). */
export const conversationRowSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  provider_id: z.string(),
  order_id: z.string().nullable(),
  quote_request_id: z.string().nullable(),
  subject: z.string().nullable(),
  status: z.enum(CONVERSATION_STATUSES),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Shape of a `public.messages` row from Supabase (snake_case). */
export const messageRowSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  body: z.string().nullable(),
  attachments: z.array(z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export const createConversationSchema = z.object({
  providerId: z.uuid(),
  subject: z.string().max(200).optional(),
  orderId: z.uuid().optional(),
  quoteRequestId: z.uuid().optional(),
});

export const createMessageSchema = z
  .object({
    body: z.string().trim().max(4000).optional(),
    attachments: z.array(z.unknown()).max(10).default([]),
  })
  .refine((v) => (v.body && v.body.length > 0) || v.attachments.length > 0, {
    message: "A message must have a body or at least one attachment.",
  });

export const listConversationsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CONVERSATION_STATUSES).optional(),
});

export const listMessagesQuerySchema = paginationQuerySchema;
