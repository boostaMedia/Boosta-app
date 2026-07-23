import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale negotiation + redirects for every non-static, non-API request.
 *
 * Uses the Next.js `proxy` file convention (the successor to `middleware`).
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (`/api`, `/trpc`)
  // - Next.js internals (`/_next`, `/_vercel`)
  // - Files with an extension (e.g. `favicon.ico`, `image.png`)
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
