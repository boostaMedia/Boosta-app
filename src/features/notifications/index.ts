import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createNotificationsRepository } from "./repository";
import {
  createNotificationsService,
  type NotificationsService,
} from "./service";

/** Build a notifications service bound to the request's Supabase client. */
export async function getNotificationsService(): Promise<NotificationsService> {
  const supabase = await createClient();
  return createNotificationsService(createNotificationsRepository(supabase));
}

export { listNotificationsQuerySchema } from "./schemas";
export type { Notification } from "./types";
export type { NotificationsService } from "./service";
