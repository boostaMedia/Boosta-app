import { requireApiUser } from "@/features/auth";
import { getNotificationsService } from "@/features/notifications";
import { jsonOk, route } from "@/lib/api";

/** POST /api/notifications/read-all — mark all of the caller's as read. */
export const POST = route(async () => {
  const user = await requireApiUser();
  const service = await getNotificationsService();
  return jsonOk(await service.markAllRead(user.id));
});
