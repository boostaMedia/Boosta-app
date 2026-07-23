"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Accessible light/dark theme toggle. Both icons are always rendered and shown
 * via CSS `dark:` variants, so there is no hydration mismatch and no need to
 * track a `mounted` flag — `next-themes` applies the `.dark` class before paint.
 */
export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
      <span className="sr-only">{t("toggleTheme")}</span>
    </Button>
  );
}
