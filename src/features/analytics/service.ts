import type { AnalyticsRepository } from "./repository";
import type { AnalyticsContext, AnalyticsOverview } from "./types";

/**
 * Analytics business logic — read-only aggregate overviews scoped to the
 * caller: admins see platform-wide metrics, providers see their business, and
 * customers see their own activity. Counts respect RLS.
 */
export interface AnalyticsService {
  overview(context: AnalyticsContext): Promise<AnalyticsOverview>;
}

export function createAnalyticsService(
  repo: AnalyticsRepository,
): AnalyticsService {
  return {
    async overview(context) {
      if (context.role === "admin") {
        return { scope: "admin", metrics: await repo.adminOverview() };
      }
      if (context.providerId) {
        return {
          scope: "provider",
          metrics: await repo.providerOverview(context.providerId),
        };
      }
      return {
        scope: "customer",
        metrics: await repo.customerOverview(context.userId),
      };
    },
  };
}
