import { requireApiUser } from "@/features/auth";
import { getOrdersService, updateOrderStatusSchema } from "@/features/orders";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/orders/:id/status — a participant advances the order status. The
 * status-history trail is written automatically by a database trigger.
 */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateOrderStatusSchema);
  const service = await getOrdersService();
  return jsonOk(await service.updateStatus(id, input));
});
