import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createQuotesRepository } from "./repository";
import { createQuotesService, type QuotesService } from "./service";

/** Build a quotes service bound to the request's Supabase client. */
export async function getQuotesService(): Promise<QuotesService> {
  const supabase = await createClient();
  return createQuotesService(createQuotesRepository(supabase));
}

export {
  createQuoteRequestSchema,
  updateQuoteRequestSchema,
  listQuoteRequestsQuerySchema,
} from "./schemas";
export type { QuoteRequest } from "./types";
export type { QuotesService } from "./service";
