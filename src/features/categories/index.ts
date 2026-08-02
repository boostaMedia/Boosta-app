import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createCategoriesRepository } from "./repository";
import { createCategoriesService, type CategoriesService } from "./service";

/**
 * Build a categories service bound to the current request's Supabase client
 * (so RLS applies with the caller's identity).
 */
export async function getCategoriesService(): Promise<CategoriesService> {
  const supabase = await createClient();
  return createCategoriesService(createCategoriesRepository(supabase));
}

export {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
} from "./schemas";
export type { Category } from "./types";
export type { CategoriesService } from "./service";
