import { getAnalyticsService } from "@/features/analytics";
import { requireApiUser } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import { jsonOk, route } from "@/lib/api";

/**
 * GET /api/analytics/overview — headline metrics scoped to the caller (admin /
 * provider / customer).
 */
export const GET = route(async () => {
  const user = await requireApiUser();
  const providerId = await getCurrentProviderId();
  const service = await getAnalyticsService();
  return jsonOk(
    await service.overview({
      role: user.role,
      userId: user.id,
      providerId,
    }),
  );
});
