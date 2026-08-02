import { getSubscriptionsService } from "@/features/subscriptions";
import { jsonOk, route } from "@/lib/api";

/** GET /api/subscriptions/packages — public catalog of active plans. */
export const GET = route(async () => {
  const service = await getSubscriptionsService();
  return jsonOk(await service.listPackages());
});
