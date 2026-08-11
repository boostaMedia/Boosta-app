import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createBusinessListingsRepository } from "./repository";
import {
  createBusinessListingsService,
  type BusinessListingsService,
} from "./service";

/** Build a business-listings service bound to the current request's Supabase client (so RLS applies). */
export async function getBusinessListingsService(): Promise<BusinessListingsService> {
  const supabase = await createClient();
  return createBusinessListingsService(
    createBusinessListingsRepository(supabase),
  );
}

export {
  createBusinessListingSchema,
  updateBusinessListingSchema,
  listBusinessListingsQuerySchema,
} from "./schemas";
export type { BusinessListing, BusinessListingStatus } from "./types";
export type { BusinessListingsService } from "./service";
