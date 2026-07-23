import { env } from "@/lib/env";

/**
 * Static site-wide metadata. Single source of truth for the app name, URL,
 * and social/SEO defaults.
 */
export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  description:
    "Boosta is a multi-vendor service marketplace for Kuwait and the GCC.",
  locales: ["ar", "en"] as const,
  defaultLocale: "ar" as const,
} as const;

export type SiteConfig = typeof siteConfig;
