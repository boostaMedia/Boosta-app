import { requireApiUser } from "@/features/auth";
import {
  getPaymentsService,
  listPaymentsQuerySchema,
} from "@/features/payments";
import { jsonPaginated, parseQuery, route } from "@/lib/api";

/** GET /api/payments — the caller's payments (payer/provider/admin via RLS). */
export const GET = route(async (request) => {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listPaymentsQuerySchema);
  const service = await getPaymentsService();
  return jsonPaginated(await service.list(query));
});
