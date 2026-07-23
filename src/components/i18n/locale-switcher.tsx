"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

/**
 * Toggles the active locale while preserving the current pathname. In Phase 1
 * we support exactly two locales, so a single switch button is sufficient.
 */
export function LocaleSwitcher() {
  const t = useTranslations("common");
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locales.find((locale) => locale !== activeLocale)!;

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={t("switchLanguage")}
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
        })
      }
    >
      {localeLabels[nextLocale]}
    </Button>
  );
}
