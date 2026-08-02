import { requireApiUser } from "@/features/auth";
import { getNotificationsService } from "@/features/notifications";
import { jsonOk, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/notifications/:id/read — mark one of the caller's as read. */
export const PATCH = route<Context>(async (_request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const service = await getNotificationsService();
  return jsonOk(await service.markRead(user.id, id));
});
