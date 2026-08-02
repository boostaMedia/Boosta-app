import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  notificationRowSchema,
} from "./schemas";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Domain entity (camelCase) exposed by the notifications service. */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  titleEn: string;
  titleAr: string;
  bodyEn: string | null;
  bodyAr: string | null;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type NotificationRow = z.infer<typeof notificationRowSchema>;

export interface ListNotificationsParams extends PaginationQuery {
  unreadOnly: boolean;
}
