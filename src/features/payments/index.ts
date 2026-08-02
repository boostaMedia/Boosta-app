import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createPaymentsRepository } from "./repository";
import { createPaymentsService, type PaymentsService } from "./service";

/** Build a payments service bound to the request's Supabase client. */
export async function getPaymentsService(): Promise<PaymentsService> {
  const supabase = await createClient();
  return createPaymentsService(createPaymentsRepository(supabase));
}

export { listPaymentsQuerySchema } from "./schemas";
export type { Payment } from "./types";
export type { PaymentsService } from "./service";
