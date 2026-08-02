import type { PaginationQuery } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { MessagesRepository } from "./repository";
import type {
  Conversation,
  CreateConversationInput,
  CreateMessageInput,
  ListConversationsParams,
  Message,
} from "./types";

export interface MessagesService {
  listConversations(
    params: ListConversationsParams,
  ): Promise<Paginated<Conversation>>;
  getConversation(id: string): Promise<Conversation>;
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

    async getConversation(id) {
      const conversation = await repo.findConversation(id);
      if (!conversation) throw new NotFoundError("Conversation not found.");
      return conversation;
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
  };
}
