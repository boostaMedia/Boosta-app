import { requireApiRole } from "@/features/auth";
import {
  createCategorySchema,
  getCategoriesService,
  listCategoriesQuerySchema,
} from "@/features/categories";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/** GET /api/categories — public, paginated list with optional search/filter. */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listCategoriesQuerySchema);
  const service = await getCategoriesService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/categories — admin only. */
export const POST = route(async (request) => {
  await requireApiRole("admin");
  const input = await parseBody(request, createCategorySchema);
  const service = await getCategoriesService();
  return jsonCreated(await service.create(input));
});
