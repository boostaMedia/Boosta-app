import { requireApiUser } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import {
  createSubscriptionSchema,
  getSubscriptionsService,
} from "@/features/subscriptions";
import { jsonCreated, jsonOk, parseBody, route } from "@/lib/api";
import { ForbiddenError } from "@/lib/errors";

/** GET /api/subscriptions — the caller provider's subscriptions (RLS). */
export const GET = route(async () => {
  await requireApiUser();
  const service = await getSubscriptionsService();
  return jsonOk(await service.listMine());
});

/** POST /api/subscriptions — the caller's provider subscribes to a plan. */
export const POST = route(async (request) => {
  await requireApiUser();
  const providerId = await getCurrentProviderId();
  if (!providerId) {
    throw new ForbiddenError("A provider profile is required to subscribe.");
  }
  const input = await parseBody(request, createSubscriptionSchema);
  const service = await getSubscriptionsService();
  return jsonCreated(await service.subscribe(providerId, input));
});
