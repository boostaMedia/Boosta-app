import { requireApiUser } from "@/features/auth";
import {
  createOrderSchema,
  getOrdersService,
  listOrdersQuerySchema,
} from "@/features/orders";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/** GET /api/orders — the caller's orders (customer or provider view via RLS). */
export const GET = route(async (request) => {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listOrdersQuerySchema);
  const service = await getOrdersService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/orders — the authenticated customer places an order. */
export const POST = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, createOrderSchema);
  const service = await getOrdersService();
  return jsonCreated(await service.create(user.id, input));
});
