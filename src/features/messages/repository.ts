import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";
import type { PaginationQuery } from "@/lib/api";

import type {
  conversationRowSchema,
  counterpartRowSchema,
  messageRowSchema,
} from "./schemas";
import type {
  Conversation,
  Counterparty,
  CreateConversationInput,
  CreateMessageInput,
  ListConversationsParams,
  Message,
} from "./types";

type ConversationRow = z.infer<typeof conversationRowSchema>;
type MessageRow = z.infer<typeof messageRowSchema>;
type CounterpartRow = z.infer<typeof counterpartRowSchema>;

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
    type: row.type,
    paymentRequestId: row.payment_request_id,
  };
}

function toCounterparty(row: CounterpartRow): Counterparty {
  return {
    kind: row.counterparty_kind,
    nameEn: row.display_name_en,
    nameAr: row.display_name_ar,
    avatarUrl: row.avatar_url,
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
  /** Resolve the "other side" for each conversation via a SECURITY DEFINER RPC (bypasses profiles RLS, scoped to conversations the caller participates in). */
  getCounterparts(
    conversationIds: string[],
  ): Promise<Map<string, Counterparty>>;
  /** The most recent message per conversation (for a thread-list preview). */
  getLastMessages(conversationIds: string[]): Promise<Map<string, Message>>;
  /** Count of unread messages not sent by `viewerId`, per conversation. */
  getUnreadCounts(
    conversationIds: string[],
    viewerId: string,
  ): Promise<Map<string, number>>;
  /** Mark every message not sent by `viewerId` as read in this conversation. */
  markConversationRead(conversationId: string, viewerId: string): Promise<void>;
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

    async getCounterparts(conversationIds) {
      if (conversationIds.length === 0) return new Map();
      const { data, error } = await supabase.rpc(
        "get_conversation_counterparts",
        { p_conversation_ids: conversationIds },
      );
      if (error) throw new Error(error.message);
      const map = new Map<string, Counterparty>();
      for (const row of (data ?? []) as CounterpartRow[]) {
        map.set(row.conversation_id, toCounterparty(row));
      }
      return map;
    },

    async getLastMessages(conversationIds) {
      if (conversationIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const map = new Map<string, Message>();
      for (const row of (data ?? []) as MessageRow[]) {
        // Rows arrive newest-first; keep only the first (= latest) per conversation.
        if (!map.has(row.conversation_id)) {
          map.set(row.conversation_id, toMessage(row));
        }
      }
      return map;
    },

    async getUnreadCounts(conversationIds, viewerId) {
      if (conversationIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", viewerId)
        .is("deleted_at", null);
      if (error) throw new Error(error.message);
      const map = new Map<string, number>();
      for (const row of (data ?? []) as { conversation_id: string }[]) {
        map.set(row.conversation_id, (map.get(row.conversation_id) ?? 0) + 1);
      }
      return map;
    },

    async markConversationRead(conversationId, viewerId) {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", viewerId);
      if (error) throw new Error(error.message);
    },
  };
}
