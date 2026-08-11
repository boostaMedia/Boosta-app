import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  CONVERSATION_STATUSES,
  createConversationSchema,
  createMessageSchema,
  MESSAGE_TYPES,
} from "./schemas";

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];

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
  type: MessageType;
  paymentRequestId: string | null;
}

/** The "other side" of a conversation, resolved for display. */
export interface Counterparty {
  kind: "provider" | "customer";
  nameEn: string | null;
  nameAr: string | null;
  avatarUrl: string | null;
}

/** A conversation enriched with what a thread list needs to render a row. */
export interface ConversationSummary extends Conversation {
  counterparty: Counterparty | null;
  lastMessage: Message | null;
  unreadCount: number;
}

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export interface ListConversationsParams extends PaginationQuery {
  status?: ConversationStatus;
}
