import { requireApiRole } from "@/features/auth";
import { getUsersService, listUsersQuerySchema } from "@/features/users";
import { jsonPaginated, parseQuery, route } from "@/lib/api";

/** GET /api/users — admin-only, paginated list with role/status/search. */
export const GET = route(async (request) => {
  await requireApiRole("admin");
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listUsersQuerySchema);
  const service = await getUsersService();
  return jsonPaginated(await service.list(query));
});
