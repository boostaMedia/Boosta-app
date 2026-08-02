import { requireApiUser } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import {
  createServiceSchema,
  getServicesService,
  listServicesQuerySchema,
} from "@/features/services";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";

/** GET /api/services — public, paginated list with filters. */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listServicesQuerySchema);
  const service = await getServicesService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/services — the caller's provider profile owns the new service. */
export const POST = route(async (request) => {
  await requireApiUser();
  const providerId = await getCurrentProviderId();
  if (!providerId) {
    throw new ForbiddenError(
      "A provider profile is required to create services.",
    );
  }
  const input = await parseBody(request, createServiceSchema);
  const service = await getServicesService();
  return jsonCreated(await service.create(providerId, input));
});
