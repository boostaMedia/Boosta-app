import {
  Briefcase,
  Building2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { CATEGORY_ITEMS } from "@/config/categories";
import { getBusinessListingsService } from "@/features/business-listings";
import type { BusinessListing } from "@/features/business-listings";
import { Link } from "@/i18n/navigation";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const log = logger.child({ module: "landing-page" });

/**
 * Featured "Projects for Sale" listings for the landing page. Real data,
 * honest empty state — no listings exist until a provider creates one, and
 * that's shown as such rather than filled in with placeholders.
 */
async function loadFeaturedListings(): Promise<BusinessListing[]> {
  try {
    const service = await getBusinessListingsService();
    const { items } = await service.list({
      page: 1,
      pageSize: 6,
      featuredOnly: false,
      status: "active",
    });
    return items;
  } catch (error) {
    log.warn("business_listings.load_failed", { error });
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const listings = await loadFeaturedListings();

  return <Home listings={listings} />;
}

function Home({ listings }: { listings: BusinessListing[] }) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("customerHome.cat");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";

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

        {/* Projects for sale */}
        <section className="w-full space-y-5">
          <div className="max-w-2xl space-y-1.5">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {t("listingsTitle")}
            </h2>
            <p className="text-muted-foreground">{t("listingsSubtitle")}</p>
          </div>
          {listings.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const title =
                  locale === "ar" ? listing.titleAr : listing.titleEn;
                const industry =
                  locale === "ar" ? listing.industryAr : listing.industryEn;
                return (
                  <li
                    key={listing.id}
                    className="bg-card hover:border-brand/40 flex flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-colors"
                  >
                    <div className="bg-brand-gradient flex size-11 items-center justify-center rounded-xl text-white shadow-sm">
                      <Building2 className="size-5" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold">{title}</h3>
                      {industry && (
                        <p className="text-muted-foreground text-sm">
                          {industry}
                        </p>
                      )}
                    </div>
                    <p className="text-primary font-heading text-lg font-bold">
                      {listing.askingPrice.toLocaleString(
                        locale === "ar" ? "ar-KW" : "en-KW",
                        { minimumFractionDigits: 0, maximumFractionDigits: 0 },
                      )}{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        {currency}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-card border-border rounded-2xl border border-dashed p-8 text-center">
              <p className="font-bold">{t("listingsEmptyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("listingsEmptySubtitle")}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
