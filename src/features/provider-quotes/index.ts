import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createProviderQuotesRepository } from "./repository";
import {
  createProviderQuotesService,
  type ProviderQuotesService,
} from "./service";

/** Build a provider-quotes service bound to the request's Supabase client. */
export async function getProviderQuotesService(): Promise<ProviderQuotesService> {
  const supabase = await createClient();
  return createProviderQuotesService(createProviderQuotesRepository(supabase));
}

export {
  createProviderQuoteSchema,
  updateProviderQuoteSchema,
  listProviderQuotesQuerySchema,
} from "./schemas";
export type { ProviderQuote } from "./types";
export type { ProviderQuotesService } from "./service";
