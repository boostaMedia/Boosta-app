import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Home />;
}

function Home() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const features = [
    { key: "rtl", Icon: Sparkles },
    { key: "secure", Icon: ShieldCheck },
    { key: "scalable", Icon: TrendingUp },
  ] as const;

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">
          {tCommon("appName")}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-10 px-6 py-16">
        <div className="flex max-w-2xl flex-col gap-5">
          <span className="text-primary text-sm font-medium">
            {t("eyebrow")}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            {t("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">{t("ctaPrimary")}</Button>
            <Button size="lg" variant="outline">
              {t("ctaSecondary")}
            </Button>
          </div>
        </div>

        <ul className="grid w-full gap-4 sm:grid-cols-3">
          {features.map(({ key, Icon }) => (
            <li
              key={key}
              className="bg-card flex flex-col gap-2 rounded-xl border p-5"
            >
              <Icon className="text-primary size-6" aria-hidden />
              <h2 className="font-semibold">{t(`features.${key}.title`)}</h2>
              <p className="text-muted-foreground text-sm">
                {t(`features.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
