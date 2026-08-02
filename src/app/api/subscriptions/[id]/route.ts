import { requireApiUser } from "@/features/auth";
import {
  getSubscriptionsService,
  updateSubscriptionSchema,
} from "@/features/subscriptions";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/subscriptions/:id — the owning provider toggles auto-renew or
 * cancels. RLS ensures a provider can only touch their own subscription.
 */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateSubscriptionSchema);
  const service = await getSubscriptionsService();
  return jsonOk(await service.update(id, input));
});
