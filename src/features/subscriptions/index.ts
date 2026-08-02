import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createSubscriptionsRepository } from "./repository";
import {
  createSubscriptionsService,
  type SubscriptionsService,
} from "./service";

/** Build a subscriptions service bound to the request's Supabase client. */
export async function getSubscriptionsService(): Promise<SubscriptionsService> {
  const supabase = await createClient();
  return createSubscriptionsService(createSubscriptionsRepository(supabase));
}

export { createSubscriptionSchema, updateSubscriptionSchema } from "./schemas";
export type { ProviderPackage, Subscription } from "./types";
export type { SubscriptionsService } from "./service";
