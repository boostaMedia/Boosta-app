import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAppUser, getAuthUser, postLoginPath } from "@/features/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const log = logger.child({ module: "auth-callback" });

/** Roughly "was this session just created", used to gate the one-time role pick below. */
const NEW_USER_WINDOW_MS = 10_000;

/**
 * OAuth redirect target (Google, Apple, ...). Deliberately outside the
 * `[locale]` segment — `proxy.ts` excludes `/api/*` from the i18n
 * middleware, so this URL is stable regardless of locale, which is what an
 * OAuth provider's registered redirect URL needs to be. The locale to
 * return to is carried through as a query param on `redirectTo` instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") === "en" ? "en" : "ar";
  const roleParam = searchParams.get("role");
  const requestedRole =
    roleParam === "provider" || roleParam === "customer" ? roleParam : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    log.warn("oauth_callback.exchange_failed", { error });
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=oauth_failed`,
    );
  }

  // OAuth providers don't let us set public.users.role at creation the way
  // OTP sign-up does (via raw_user_meta_data) — Google/Apple only give us
  // their own profile claims. So instead: on what looks like this account's
  // very first session (created_at and last_sign_in_at are within seconds of
  // each other), apply the role the user picked before leaving for the OAuth
  // provider. RLS (see restrict_self_role_update) only allows this update to
  // land on 'customer' or 'provider', never 'admin', so this is safe even
  // though it's a plain self-service update — not a special-cased escape
  // hatch.
  if (requestedRole) {
    const authUser = await getAuthUser();
    if (authUser) {
      const createdAt = new Date(authUser.created_at).getTime();
      const lastSignInAt = authUser.last_sign_in_at
        ? new Date(authUser.last_sign_in_at).getTime()
        : createdAt;
      const isNewSession =
        Math.abs(createdAt - lastSignInAt) < NEW_USER_WINDOW_MS;
      if (isNewSession) {
        const { error: roleError } = await supabase
          .from("users")
          .update({ role: requestedRole })
          .eq("id", authUser.id);
        if (roleError) {
          log.warn("oauth_callback.role_update_failed", {
            error: roleError,
          });
        }
      }
    }
  }

  const user = await getAppUser();
  const path = user ? postLoginPath(user.role) : "/home";
  return NextResponse.redirect(`${origin}/${locale}${path}`);
}
