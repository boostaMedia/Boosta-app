import type { UserRole } from "@/lib/constants";

/** Who is asking, so the overview can be scoped appropriately. */
export interface AnalyticsContext {
  role: UserRole;
  userId: string;
  providerId: string | null;
}

export type AnalyticsScope = "admin" | "provider" | "customer";

/** A scoped set of headline metrics for a dashboard. */
export interface AnalyticsOverview {
  scope: AnalyticsScope;
  metrics: Record<string, number>;
}
