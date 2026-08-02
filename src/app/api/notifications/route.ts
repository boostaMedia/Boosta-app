import { requireApiUser } from "@/features/auth";
import {
  getNotificationsService,
  listNotificationsQuerySchema,
} from "@/features/notifications";
import { jsonOk, parseQuery, route } from "@/lib/api";

/** GET /api/notifications — the caller's own notifications + unread count. */
export const GET = route(async (request) => {
  const user = await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listNotificationsQuerySchema);
  const service = await getNotificationsService();
  const { items, unreadCount, ...meta } = await service.list(user.id, query);
  return jsonOk({ items, unreadCount, meta });
});
