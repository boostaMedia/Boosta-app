import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createProvidersRepository } from "./repository";
import { createProvidersService, type ProvidersService } from "./service";

/** Build a providers service bound to the current request's Supabase client. */
export async function getProvidersService(): Promise<ProvidersService> {
  const supabase = await createClient();
  return createProvidersService(createProvidersRepository(supabase));
}

/**
 * Resolve the provider id owned by the current user, or null. Uses the
 * `current_provider_id()` SQL function (SECURITY DEFINER) so it works
 * regardless of the caller's row-level visibility.
 */
export async function getCurrentProviderId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_provider_id");
  if (error) return null;
  return (data as string | null) ?? null;
}

export {
  createProviderSchema,
  updateProviderSchema,
  adminUpdateProviderSchema,
  listProvidersQuerySchema,
} from "./schemas";
export type { Provider, ProviderStatus } from "./types";
export type { ProvidersService } from "./service";
