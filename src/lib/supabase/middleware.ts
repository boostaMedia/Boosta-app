import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on each request and writes any rotated
 * cookies onto the given response. Called from the proxy.
 *
 * Cookies are written onto BOTH the incoming request (so downstream code in the
 * same request sees the fresh session) and the outgoing response (so the
 * browser persists it). No-ops when Supabase is not configured.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase and triggers the
  // cookie rotation above. Do not remove.
  await supabase.auth.getUser();
}
