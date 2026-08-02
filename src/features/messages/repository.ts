import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import type { PaginationQuery } from "@/lib/api";

import type { conversationRowSchema, messageRowSchema } from "./schemas";
import type {
  Conversation,
  CreateConversationInput,
  CreateMessageInput,
  ListConversationsParams,
  Message,
} from "./types";

type ConversationRow = z.infer<typeof conversationRowSchema>;
type MessageRow = z.infer<typeof messageRowSchema>;

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    customerId: row.customer_id,
    providerId: row.provider_id,
    orderId: row.order_id,
    quoteRequestId: row.quote_request_id,
    subject: row.subject,
    status: row.status,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    attachments: row.attachments,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export interface MessagesRepository {
  listConversations(
    params: ListConversationsParams,
  ): Promise<{ items: Conversation[]; total: number }>;
  findConversation(id: string): Promise<Conversation | null>;
  createConversation(
    customerId: string,
    input: CreateConversationInput,
  ): Promise<Conversation>;
  listMessages(
    conversationId: string,
    params: PaginationQuery,
  ): Promise<{ items: Message[]; total: number }>;
  createMessage(
    conversationId: string,
    senderId: string,
    input: CreateMessageInput,
  ): Promise<Message>;
}

export function createMessagesRepository(
  supabase: SupabaseClient,
): MessagesRepository {
  return {
    async listConversations(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from("conversations")
        .select("*", { count: "exact" });
      if (params.status) query = query.eq("status", params.status);

      const { data, error, count } = await query
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as ConversationRow[]).map(toConversation),
        total: count ?? 0,
      };
    },

    async findConversation(id) {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toConversation(data as ConversationRow) : null;
    },

    async createConversation(customerId, input) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          customer_id: customerId,
          provider_id: input.providerId,
          subject: input.subject ?? null,
          order_id: input.orderId ?? null,
          quote_request_id: input.quoteRequestId ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toConversation(data as ConversationRow);
    },

    async listMessages(conversationId, params) {
      const { from, to } = rangeFor(params);
      const { data, error, count } = await supabase
        .from("messages")
        .select("*", { count: "exact" })
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .range(from, to);
      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as MessageRow[]).map(toMessage),
        total: count ?? 0,
      };
    },

    async createMessage(conversationId, senderId, input) {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          body: input.body ?? null,
          attachments: input.attachments,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toMessage(data as MessageRow);
    },
  };
}
