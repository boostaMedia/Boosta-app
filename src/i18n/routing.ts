import { defineRouting } from "next-intl/routing";

/**
 * Supported locales for Boosta.
 *
 * Arabic (`ar`) is the primary, RTL-first locale. English (`en`) is the
 * secondary, LTR locale. The order is significant only for documentation;
 * locale negotiation is handled by the middleware.
 */
export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

/** Arabic is the default, RTL-first locale for the Kuwait/GCC market. */
export const defaultLocale: Locale = "ar";

/** Text direction for each supported locale. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

/** Native display labels for the locale switcher. */
export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always prefix the pathname with the locale (e.g. `/ar`, `/en`) so that
  // URLs are unambiguous and shareable across markets.
  localePrefix: "always",
});
