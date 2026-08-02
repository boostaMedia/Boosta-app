import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { rangeFor } from "@/lib/api";

import type {
  ListNotificationsParams,
  Notification,
  NotificationRow,
} from "./types";

const TABLE = "notifications";

function toEntity(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    channel: row.channel,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    bodyEn: row.body_en,
    bodyAr: row.body_ar,
    data: row.data,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export interface NotificationsRepository {
  list(
    userId: string,
    params: ListNotificationsParams,
  ): Promise<{ items: Notification[]; total: number }>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, id: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
}

export function createNotificationsRepository(
  supabase: SupabaseClient,
): NotificationsRepository {
  return {
    async list(userId, params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from(TABLE)
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (params.unreadOnly) query = query.eq("is_read", false);

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as NotificationRow[]).map(toEntity),
        total: count ?? 0,
      };
    },

    async unreadCount(userId) {
      const { count, error } = await supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    async markRead(userId, id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toEntity(data as NotificationRow) : null;
    },

    async markAllRead(userId) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select("id");
      if (error) throw new Error(error.message);
      return (data ?? []).length;
    },
  };
}
