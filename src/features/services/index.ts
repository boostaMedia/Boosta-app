import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createServicesRepository } from "./repository";
import { createServicesService, type ServicesService } from "./service";

/** Build a services service bound to the current request's Supabase client. */
export async function getServicesService(): Promise<ServicesService> {
  const supabase = await createClient();
  return createServicesService(createServicesRepository(supabase));
}

export {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} from "./schemas";
export type { Service } from "./types";
export type { ServicesService } from "./service";
