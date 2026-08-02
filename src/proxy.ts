import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/middleware";

/**
 * Request proxy (successor to the `middleware` convention). Runs on every
 * non-static, non-API request and does two things in order:
 *   1. Locale negotiation + redirects (next-intl).
 *   2. Supabase auth session refresh, writing rotated cookies onto the response.
 */
const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  await refreshSession(request, response);
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes (`/api`, `/trpc`)
  // - Next.js internals (`/_next`, `/_vercel`)
  // - Files with an extension (e.g. `favicon.ico`, `image.png`)
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
