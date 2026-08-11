import {
  Briefcase,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { CATEGORY_ITEMS } from "@/config/categories";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
  const tCat = useTranslations("customerHome.cat");

  const features = [
    { key: "rtl", Icon: Sparkles },
    { key: "secure", Icon: ShieldCheck },
    { key: "scalable", Icon: TrendingUp },
  ] as const;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Brand gradient glow backdrop */}
      <div
        aria-hidden
        className="bg-brand-gradient pointer-events-none absolute -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl ltr:-right-24 rtl:-left-24"
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <span className="font-heading text-xl font-extrabold tracking-tight">
          {tCommon("appName")}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-12 px-6 py-16">
        <div className="flex max-w-2xl flex-col items-start gap-5">
          <Logo priority className="mb-1 h-14" />

          <span className="border-border/60 bg-accent text-accent-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
            {t("eyebrow")}
          </span>

          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h1>

          <p className="text-muted-foreground text-lg text-pretty">
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login?role=customer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-gradient border-0 text-white shadow-md hover:opacity-90",
              )}
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/home"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* Join Boosta — individual vs. business */}
        <section className="w-full max-w-2xl space-y-3">
          <h2 className="font-heading text-lg font-bold">{t("joinTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/login?role=customer"
              className="bg-card hover:border-brand/40 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
            >
              <span className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-white">
                <User className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-bold">{t("joinIndividual")}</span>
                <span className="text-muted-foreground block text-sm">
                  {t("joinIndividualSubtitle")}
                </span>
              </span>
            </Link>
            <Link
              href="/login?role=provider"
              className="bg-card hover:border-brand/40 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
            >
              <span className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-white">
                <Briefcase className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-bold">{t("joinBusiness")}</span>
                <span className="text-muted-foreground block text-sm">
                  {t("joinBusinessSubtitle")}
                </span>
              </span>
            </Link>
          </div>
        </section>

        <ul className="grid w-full gap-4 sm:grid-cols-3">
          {features.map(({ key, Icon }) => (
            <li
              key={key}
              className="bg-card hover:border-brand/40 flex flex-col gap-3 rounded-2xl border p-6 shadow-sm transition-colors"
            >
              <div className="bg-brand-gradient flex size-11 items-center justify-center rounded-xl text-white shadow-sm">
                <Icon className="size-5" aria-hidden />
              </div>
              <h2 className="font-heading font-bold">
                {t(`features.${key}.title`)}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t(`features.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>

        {/* Service categories */}
        <section className="w-full space-y-5">
          <div className="max-w-2xl space-y-1.5">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {t("servicesTitle")}
            </h2>
            <p className="text-muted-foreground">{t("servicesSubtitle")}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORY_ITEMS.map(({ key, Icon }) => (
              <li
                key={key}
                className="bg-card hover:border-brand/40 flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors"
              >
                <span className="bg-brand-gradient grid size-10 shrink-0 place-items-center rounded-lg text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold">{tCat(key)}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
