import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createAnalyticsRepository } from "./repository";
import { createAnalyticsService, type AnalyticsService } from "./service";

/** Build an analytics service bound to the request's Supabase client. */
export async function getAnalyticsService(): Promise<AnalyticsService> {
  const supabase = await createClient();
  return createAnalyticsService(createAnalyticsRepository(supabase));
}

export type { AnalyticsOverview } from "./types";
export type { AnalyticsService } from "./service";
