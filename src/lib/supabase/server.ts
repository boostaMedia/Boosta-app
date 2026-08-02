import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./client";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Bridges Supabase's session to Next.js request cookies.
 *
 * Note: cookie writes from a Server Component are ignored by Next.js — session
 * refresh happens in the proxy (see `src/lib/supabase/middleware.ts`), so the
 * ignored writes here are safe.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — safe to ignore; the proxy refreshes
          // the session on the next request.
        }
      },
    },
  });
}
