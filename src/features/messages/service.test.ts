import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { MessagesRepository } from "./repository";
import { createMessagesService } from "./service";
import type { Conversation, Counterparty, Message } from "./types";

const conversation: Conversation = {
  id: "c1",
  customerId: "u1",
  providerId: "p1",
  orderId: null,
  quoteRequestId: null,
  subject: null,
  status: "open",
  lastMessageAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const message: Message = {
  id: "m1",
  conversationId: "c1",
  senderId: "u1",
  body: "Hello",
  attachments: [],
  isRead: false,
  readAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  type: "text",
  paymentRequestId: null,
};

const counterparty: Counterparty = {
  kind: "provider",
  nameEn: "Pixel Studio",
  nameAr: "بيكسل ستوديو",
  avatarUrl: null,
};

function fakeRepo(
  overrides: Partial<MessagesRepository> = {},
): MessagesRepository {
  return {
    listConversations: vi
      .fn()
      .mockResolvedValue({ items: [conversation], total: 1 }),
    findConversation: vi.fn().mockResolvedValue(conversation),
    createConversation: vi.fn().mockResolvedValue(conversation),
    listMessages: vi.fn().mockResolvedValue({ items: [message], total: 1 }),
    createMessage: vi.fn().mockResolvedValue(message),
    getCounterparts: vi.fn().mockResolvedValue(new Map([["c1", counterparty]])),
    getLastMessages: vi.fn().mockResolvedValue(new Map([["c1", message]])),
    getUnreadCounts: vi.fn().mockResolvedValue(new Map([["c1", 1]])),
    markConversationRead: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("MessagesService", () => {
  it("sends a message after confirming the conversation is visible", async () => {
    const createMessage = vi.fn().mockResolvedValue(message);
    const service = createMessagesService(fakeRepo({ createMessage }));
    const result = await service.sendMessage("c1", "u1", {
      body: "Hello",
      attachments: [],
    });
    expect(result.body).toBe("Hello");
    expect(createMessage).toHaveBeenCalledWith("c1", "u1", expect.any(Object));
  });

  it("throws NotFoundError when messaging a hidden conversation", async () => {
    const service = createMessagesService(
      fakeRepo({ findConversation: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.sendMessage("x", "u1", { body: "Hi", attachments: [] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists messages with a paginated envelope", async () => {
    const service = createMessagesService(fakeRepo());
    const result = await service.listMessages("c1", { page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
  });

  it("getConversation() throws NotFoundError when missing", async () => {
    const service = createMessagesService(
      fakeRepo({ findConversation: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.getConversation("x")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("listConversationSummaries() enriches conversations with counterparty, last message, and unread count", async () => {
    const service = createMessagesService(fakeRepo());
    const result = await service.listConversationSummaries("u1", {
      page: 1,
      pageSize: 20,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].counterparty).toEqual(counterparty);
    expect(result.items[0].lastMessage).toEqual(message);
    expect(result.items[0].unreadCount).toBe(1);
  });

  it("getCounterparty() returns the resolved counterparty or null", async () => {
    const service = createMessagesService(fakeRepo());
    expect(await service.getCounterparty("c1")).toEqual(counterparty);
    expect(await service.getCounterparty("missing")).toBeNull();
  });

  it("markRead() throws NotFoundError for a hidden conversation, otherwise delegates", async () => {
    const markConversationRead = vi.fn().mockResolvedValue(undefined);
    const service = createMessagesService(fakeRepo({ markConversationRead }));
    await service.markRead("c1", "u1");
    expect(markConversationRead).toHaveBeenCalledWith("c1", "u1");

    const hiddenService = createMessagesService(
      fakeRepo({ findConversation: vi.fn().mockResolvedValue(null) }),
    );
    await expect(hiddenService.markRead("x", "u1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
