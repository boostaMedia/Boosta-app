import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createProvidersRepository } from "./repository";
import { createProvidersService, type ProvidersService } from "./service";
import type { Provider } from "./types";

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

/**
 * The signed-in user's full provider row, or null if they haven't
 * registered one yet. Callers that need to gate on `status === 'verified'`
 * (dashboard, service management, ...) should use this rather than just
 * {@link getCurrentProviderId} — having a row is not the same as being
 * approved.
 */
export async function getCurrentProvider(): Promise<Provider | null> {
  const id = await getCurrentProviderId();
  if (!id) return null;
  const service = await getProvidersService();
  try {
    return await service.get(id);
  } catch {
    return null;
  }
}

export {
  createProviderSchema,
  updateProviderSchema,
  adminUpdateProviderSchema,
  listProvidersQuerySchema,
} from "./schemas";
export type { Provider, ProviderStatus } from "./types";
export type { ProvidersService } from "./service";
