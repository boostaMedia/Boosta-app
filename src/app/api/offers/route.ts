import { requireApiUser } from "@/features/auth";
import {
  createOfferSchema,
  getOffersService,
  listOffersQuerySchema,
} from "@/features/offers";
import { getCurrentProviderId } from "@/features/providers";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";

/** GET /api/offers — public, paginated list with filters. */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listOffersQuerySchema);
  const service = await getOffersService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/offers — owned by the caller's provider profile. */
export const POST = route(async (request) => {
  await requireApiUser();
  const providerId = await getCurrentProviderId();
  if (!providerId) {
    throw new ForbiddenError(
      "A provider profile is required to create offers.",
    );
  }
  const input = await parseBody(request, createOfferSchema);
  const service = await getOffersService();
  return jsonCreated(await service.create(providerId, input));
});
