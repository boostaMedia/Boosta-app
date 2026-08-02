import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { NotificationsRepository } from "./repository";
import { createNotificationsService } from "./service";
import type { ListNotificationsParams, Notification } from "./types";

const sample: Notification = {
  id: "n1",
  userId: "u1",
  type: "order",
  channel: "in_app",
  titleEn: "Order confirmed",
  titleAr: "تم تأكيد الطلب",
  bodyEn: null,
  bodyAr: null,
  data: {},
  isRead: false,
  readAt: null,
  createdAt: "2026-01-01T00:00:00Z",
};

const listParams: ListNotificationsParams = {
  page: 1,
  pageSize: 20,
  unreadOnly: false,
};

function fakeRepo(
  overrides: Partial<NotificationsRepository> = {},
): NotificationsRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [sample], total: 1 }),
    unreadCount: vi.fn().mockResolvedValue(3),
    markRead: vi.fn().mockResolvedValue({ ...sample, isRead: true }),
    markAllRead: vi.fn().mockResolvedValue(3),
    ...overrides,
  };
}

describe("NotificationsService", () => {
  it("list() returns items plus an unread count", async () => {
    const service = createNotificationsService(fakeRepo());
    const result = await service.list("u1", listParams);
    expect(result.items).toHaveLength(1);
    expect(result.unreadCount).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  it("markRead() throws NotFoundError when nothing matched", async () => {
    const service = createNotificationsService(
      fakeRepo({ markRead: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.markRead("u1", "x")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("markAllRead() reports how many were updated", async () => {
    const service = createNotificationsService(fakeRepo());
    await expect(service.markAllRead("u1")).resolves.toEqual({ updated: 3 });
  });
});
