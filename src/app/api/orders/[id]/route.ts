import { requireApiUser } from "@/features/auth";
import { getOrdersService } from "@/features/orders";
import { jsonOk, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/orders/:id — order participants (customer or provider) + admin. */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getOrdersService();
  return jsonOk(await service.get(id));
});
