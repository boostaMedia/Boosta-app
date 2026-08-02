import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createOffersRepository } from "./repository";
import { createOffersService, type OffersService } from "./service";

/** Build an offers service bound to the current request's Supabase client. */
export async function getOffersService(): Promise<OffersService> {
  const supabase = await createClient();
  return createOffersService(createOffersRepository(supabase));
}

export {
  createOfferSchema,
  updateOfferSchema,
  listOffersQuerySchema,
} from "./schemas";
export type { Offer } from "./types";
export type { OffersService } from "./service";
