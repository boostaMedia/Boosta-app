import type { User } from "@supabase/supabase-js";

import type { UserRole } from "@/lib/constants";

/** The raw Supabase auth user. */
export type AuthUser = User;

/**
 * The application user: the auth identity joined with the app-level record in
 * `public.users` (role, verification status).
 */
export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
}

/** Discriminated result returned by auth server actions. */
export type AuthActionResult = { ok: true } | { ok: false; error: string };
