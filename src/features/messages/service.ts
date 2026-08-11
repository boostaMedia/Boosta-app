import type { PaginationQuery } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { MessagesRepository } from "./repository";
import type {
  Conversation,
  ConversationSummary,
  Counterparty,
  CreateConversationInput,
  CreateMessageInput,
  ListConversationsParams,
  Message,
} from "./types";

export interface MessagesService {
  listConversations(
    params: ListConversationsParams,
  ): Promise<Paginated<Conversation>>;
  /** Conversation list enriched with counterparty, last message, and unread count — what the thread-list screen renders. */
  listConversationSummaries(
    viewerId: string,
    params: ListConversationsParams,
  ): Promise<Paginated<ConversationSummary>>;
  getConversation(id: string): Promise<Conversation>;
  /** The "other side" of a single conversation — for the chat thread header. */
  getCounterparty(conversationId: string): Promise<Counterparty | null>;
  createConversation(
    customerId: string,
    input: CreateConversationInput,
  ): Promise<Conversation>;
  listMessages(
    conversationId: string,
    params: PaginationQuery,
  ): Promise<Paginated<Message>>;
  sendMessage(
    conversationId: string,
    senderId: string,
    input: CreateMessageInput,
  ): Promise<Message>;
  markRead(conversationId: string, viewerId: string): Promise<void>;
}

function envelope<T>(
  items: T[],
  total: number,
  params: PaginationQuery,
): Paginated<T> {
  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export function createMessagesService(
  repo: MessagesRepository,
): MessagesService {
  return {
    async listConversations(params) {
      const { items, total } = await repo.listConversations(params);
      return envelope(items, total, params);
    },

    async listConversationSummaries(viewerId, params) {
      const { items, total } = await repo.listConversations(params);
      const ids = items.map((c) => c.id);
      const [counterparts, lastMessages, unreadCounts] = await Promise.all([
        repo.getCounterparts(ids),
        repo.getLastMessages(ids),
        repo.getUnreadCounts(ids, viewerId),
      ]);
      const summaries: ConversationSummary[] = items.map((c) => ({
        ...c,
        counterparty: counterparts.get(c.id) ?? null,
        lastMessage: lastMessages.get(c.id) ?? null,
        unreadCount: unreadCounts.get(c.id) ?? 0,
      }));
      return envelope(summaries, total, params);
    },

    async getConversation(id) {
      const conversation = await repo.findConversation(id);
      if (!conversation) throw new NotFoundError("Conversation not found.");
      return conversation;
    },

    async getCounterparty(conversationId) {
      const map = await repo.getCounterparts([conversationId]);
      return map.get(conversationId) ?? null;
    },

    async createConversation(customerId, input) {
      return repo.createConversation(customerId, input);
    },

    async listMessages(conversationId, params) {
      // Ensures the conversation is visible to the caller (RLS) before listing.
      const conversation = await repo.findConversation(conversationId);
      if (!conversation) throw new NotFoundError("Conversation not found.");
      const { items, total } = await repo.listMessages(conversationId, params);
      return envelope(items, total, params);
    },

    async sendMessage(conversationId, senderId, input) {
      const conversation = await repo.findConversation(conversationId);
      if (!conversation) throw new NotFoundError("Conversation not found.");
      return repo.createMessage(conversationId, senderId, input);
    },

    async markRead(conversationId, viewerId) {
      const conversation = await repo.findConversation(conversationId);
      if (!conversation) throw new NotFoundError("Conversation not found.");
      await repo.markConversationRead(conversationId, viewerId);
    },
  };
}
