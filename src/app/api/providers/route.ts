import { requireApiUser } from "@/features/auth";
import {
  createProviderSchema,
  getProvidersService,
  listProvidersQuerySchema,
} from "@/features/providers";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/** GET /api/providers — public, paginated list with search/filter. */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listProvidersQuerySchema);
  const service = await getProvidersService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/providers — any authenticated user creates their own profile. */
export const POST = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, createProviderSchema);
  const service = await getProvidersService();
  return jsonCreated(await service.create(user.id, input));
});
