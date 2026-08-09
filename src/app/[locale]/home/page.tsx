import {
  Bell,
  ChevronDown,
  type LucideIcon,
  MapPin,
  Search,
  Shapes,
  Star,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { CATEGORY_ITEMS, resolveCategoryIcon } from "@/config/categories";
import { getCategoriesService } from "@/features/categories";
import { getProvidersService } from "@/features/providers";
import { getServicesService } from "@/features/services";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "customer-home" });

/** A category ready to render: a localized label and a resolved icon. */
type HomeCategory = { id: string; name: string; Icon: LucideIcon };

/** A top-rated service ready to render. */
type HomeService = {
  id: string;
  title: string;
  providerName: string;
  rating: string;
  price: string;
  currency: string;
  Icon: LucideIcon;
};

/**
 * Load the service categories for display. Prefers the live database (so the
 * grid reflects real, admin-managed categories under RLS); if Supabase is
 * unreachable or returns nothing, falls back to the localized static config so
 * the screen always renders.
 */
async function loadCategories(locale: string): Promise<HomeCategory[]> {
  try {
    const categories = await getCategoriesService();
    const { items } = await categories.list({
      page: 1,
      pageSize: 50,
      activeOnly: true,
    });
    if (items.length > 0) {
      return items.map((c) => ({
        id: c.id,
        name: locale === "ar" ? c.nameAr : c.nameEn,
        Icon: resolveCategoryIcon(c.icon),
      }));
    }
  } catch (error) {
    log.warn("categories.load_failed_falling_back_to_static", { error });
  }

  const t = await getTranslations({ locale, namespace: "customerHome" });
  return CATEGORY_ITEMS.map(({ key, Icon }) => ({
    id: key,
    name: t(`cat.${key}`),
    Icon,
  }));
}

/**
 * Load the top-rated active services, with their provider's display name and
 * their category's icon (reusing the already-fetched category icon map to
 * avoid an extra query). Returns an empty array — rendered as an honest empty
 * state, not fabricated data — if there are no active services yet or if
 * Supabase is unreachable.
 */
async function loadTopRatedServices(
  locale: string,
  iconByCategoryId: Map<string, LucideIcon>,
): Promise<HomeService[]> {
  try {
    const services = await getServicesService();
    const { items } = await services.list({
      page: 1,
      pageSize: 4,
      status: "active",
    });
    if (items.length === 0) return [];

    const providerIds = [...new Set(items.map((s) => s.providerId))];
    const providers = await getProvidersService();
    const providerById = new Map(
      (await providers.listByIds(providerIds)).map((p) => [p.id, p]),
    );

    return items.map((s) => {
      const provider = providerById.get(s.providerId);
      return {
        id: s.id,
        title: locale === "ar" ? s.titleAr : s.titleEn,
        providerName: provider
          ? locale === "ar"
            ? provider.businessNameAr
            : provider.businessNameEn
          : "",
        rating: s.rating.toFixed(1),
        price: s.basePrice.toFixed(3),
        currency: s.currency,
        Icon: iconByCategoryId.get(s.categoryId) ?? Shapes,
      };
    });
  } catch (error) {
    log.warn("services.top_rated_load_failed", { error });
    return [];
  }
}

export default async function CustomerHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const categories = await loadCategories(locale);
  const iconByCategoryId = new Map(categories.map((c) => [c.id, c.Icon]));
  const topRated = await loadTopRatedServices(locale, iconByCategoryId);
  return <CustomerHome categories={categories} topRated={topRated} />;
}

function CustomerHome({
  categories,
  topRated,
}: {
  categories: HomeCategory[];
  topRated: HomeService[];
}) {
  const t = useTranslations("customerHome");
  const locale = useLocale();
  const initial = locale === "ar" ? "ر" : "R";

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Top bar */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">{t("deliverTo")}</p>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold"
            >
              <MapPin className="text-primary size-4" aria-hidden />
              <span className="truncate">{t("location")}</span>
              <ChevronDown
                className="text-muted-foreground size-4"
                aria-hidden
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="border-border bg-card relative grid size-10 place-items-center rounded-full border"
            >
              <Bell className="size-5" aria-hidden />
              <span className="bg-destructive absolute end-2.5 top-2.5 size-2 rounded-full" />
            </button>
            <div className="bg-brand-gradient grid size-10 place-items-center rounded-full text-sm font-bold text-white">
              {initial}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-input bg-card mt-3 flex items-center gap-2 rounded-full border px-4 py-2.5">
          <Search className="text-muted-foreground size-4" aria-hidden />
          <input
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
            placeholder={t("searchPlaceholder")}
          />
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-2 pb-6">
        {/* Promo banner */}
        <div className="bg-brand-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-md">
          <div className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
          <p className="text-lg font-extrabold">{t("promoTitle")}</p>
          <p className="mt-1 text-sm text-white/85">{t("promoSubtitle")}</p>
        </div>

        {/* Categories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold">{t("categories")}</h2>
            <button type="button" className="text-primary text-sm font-medium">
              {t("seeAll")}
            </button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {categories.map(({ id, name, Icon }) => (
              <button
                key={id}
                type="button"
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span className="bg-brand-gradient grid size-16 place-items-center rounded-2xl text-white shadow-sm">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span className="w-full truncate text-center text-xs font-medium">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Top rated */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold">{t("topRated")}</h2>
            <button type="button" className="text-primary text-sm font-medium">
              {t("seeAll")}
            </button>
          </div>
          {topRated.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {topRated.map(
                ({
                  id,
                  title,
                  providerName,
                  rating,
                  price,
                  currency,
                  Icon,
                }) => (
                  <article
                    key={id}
                    className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm"
                  >
                    <div className="bg-brand-gradient grid h-24 place-items-center text-white">
                      <Icon className="size-10" aria-hidden />
                    </div>
                    <div className="space-y-1 p-3">
                      <h3 className="truncate text-sm font-bold">{title}</h3>
                      <p className="text-muted-foreground truncate text-xs">
                        {providerName}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-xs font-medium">
                          <Star
                            className="size-3.5 fill-amber-400 text-amber-400"
                            aria-hidden
                          />
                          {rating}
                        </span>
                        <span className="text-primary text-sm font-bold">
                          {price}{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            {currency}
                          </span>
                        </span>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <p className="font-bold">{t("topRatedEmptyTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("topRatedEmptySubtitle")}
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav active="home" />
    </div>
  );
}
