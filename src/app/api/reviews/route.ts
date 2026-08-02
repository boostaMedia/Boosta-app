import { requireApiUser } from "@/features/auth";
import {
  createReviewSchema,
  getReviewsService,
  listReviewsQuerySchema,
} from "@/features/reviews";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/** GET /api/reviews — public list of reviews (filter by provider/service). */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listReviewsQuerySchema);
  const service = await getReviewsService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/reviews — the authenticated customer authors the review. */
export const POST = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, createReviewSchema);
  const service = await getReviewsService();
  return jsonCreated(await service.create(user.id, input));
});
