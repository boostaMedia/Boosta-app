import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Returns the Supabase configuration, asserting that the required public
 * environment variables are present. Kept separate so both the browser and
 * server factories share one clear failure message.
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
    );
  }

  return { url, anonKey };
}

/**
 * Supabase client for use in Client Components (browser). Reads/writes the
 * session from cookies shared with the server.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
