import { requireApiUser } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import {
  createProviderQuoteSchema,
  getProviderQuotesService,
  listProviderQuotesQuerySchema,
} from "@/features/provider-quotes";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";

/**
 * GET /api/provider-quotes — quotes visible to the caller: a provider's own,
 * or the quotes on a customer's own request (RLS-enforced).
 */
export const GET = route(async (request) => {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listProviderQuotesQuerySchema);
  const service = await getProviderQuotesService();
  return jsonPaginated(await service.list(query));
});

/** POST /api/provider-quotes — the caller's provider submits a bid. */
export const POST = route(async (request) => {
  await requireApiUser();
  const providerId = await getCurrentProviderId();
  if (!providerId) {
    throw new ForbiddenError(
      "A provider profile is required to submit quotes.",
    );
  }
  const input = await parseBody(request, createProviderQuoteSchema);
  const service = await getProviderQuotesService();
  return jsonCreated(await service.create(providerId, input));
});
