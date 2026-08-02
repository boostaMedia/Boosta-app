import "server-only";

import { cache } from "react";

import type { UserRole } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

import type { AppUser, AuthUser } from "./types";

/**
 * The authenticated Supabase user for the current request, or null.
 * Memoized per-request with React `cache` so repeated calls hit Supabase once.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The application user (auth identity + role from `public.users`) for the
 * current request, or null when unauthenticated.
 */
export const getAppUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, phone, role, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as {
    id: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
  } | null;

  if (!row) {
    // The auth user exists but the app row is not provisioned yet; treat as an
    // unverified customer until the sign-up trigger/backfill completes.
    return {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: "customer",
      isVerified: false,
    };
  }

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isVerified: row.is_verified,
  };
});
