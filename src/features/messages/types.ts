import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  CONVERSATION_STATUSES,
  createConversationSchema,
  createMessageSchema,
} from "./schemas";

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export interface Conversation {
  id: string;
  customerId: string;
  providerId: string;
  orderId: string | null;
  quoteRequestId: string | null;
  subject: string | null;
  status: ConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  attachments: unknown[];
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export interface ListConversationsParams extends PaginationQuery {
  status?: ConversationStatus;
}
