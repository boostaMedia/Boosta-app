import { requireApiUser } from "@/features/auth";
import {
  createQuoteRequestSchema,
  getQuotesService,
  listQuoteRequestsQuerySchema,
} from "@/features/quotes";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/**
 * GET /api/quotes — the caller's visible quote requests. RLS returns a
 * customer's own requests, or open requests for a provider to bid on.
 */
export const GET = route(async (request) => {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listQuoteRequestsQuerySchema);
  const service = await getQuotesService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/quotes — the authenticated customer creates a request. */
export const POST = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, createQuoteRequestSchema);
  const service = await getQuotesService();
  return jsonCreated(await service.create(user.id, input));
});
