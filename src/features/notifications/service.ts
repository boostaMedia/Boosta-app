import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { NotificationsRepository } from "./repository";
import type { ListNotificationsParams, Notification } from "./types";

export interface NotificationsService {
  list(
    userId: string,
    params: ListNotificationsParams,
  ): Promise<Paginated<Notification> & { unreadCount: number }>;
  markRead(userId: string, id: string): Promise<Notification>;
  markAllRead(userId: string): Promise<{ updated: number }>;
}

export function createNotificationsService(
  repo: NotificationsRepository,
): NotificationsService {
  return {
    async list(userId, params) {
      const [{ items, total }, unreadCount] = await Promise.all([
        repo.list(userId, params),
        repo.unreadCount(userId),
      ]);
      return {
        items,
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
        unreadCount,
      };
    },

    async markRead(userId, id) {
      const updated = await repo.markRead(userId, id);
      if (!updated) throw new NotFoundError("Notification not found.");
      return updated;
    },

    async markAllRead(userId) {
      const updated = await repo.markAllRead(userId);
      return { updated };
    },
  };
}
