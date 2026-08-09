import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { CATEGORY_ITEMS, resolveCategoryIcon } from "@/config/categories";
import { getCategoriesService } from "@/features/categories";
import { getServicesService } from "@/features/services";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "categories-screen" });

type ScreenCategory = {
  id: string;
  name: string;
  Icon: LucideIcon;
  count: number;
};

/** Count active services per category id, capped at the pagination ceiling. */
async function loadActiveServiceCounts(): Promise<Map<string, number>> {
  try {
    const services = await getServicesService();
    const { items } = await services.list({
      page: 1,
      pageSize: 100,
      status: "active",
    });
    const counts = new Map<string, number>();
    for (const service of items) {
      counts.set(service.categoryId, (counts.get(service.categoryId) ?? 0) + 1);
    }
    return counts;
  } catch (error) {
    log.warn("services.count_load_failed", { error });
    return new Map();
  }
}

/**
 * Load categories with a real active-service count per category. Prefers the
 * live database; falls back to the localized static config (with zero counts)
 * if Supabase is unreachable, so the screen always renders.
 */
async function loadCategories(locale: string): Promise<ScreenCategory[]> {
  try {
    const categories = await getCategoriesService();
    const { items } = await categories.list({
      page: 1,
      pageSize: 50,
      activeOnly: true,
    });
    if (items.length > 0) {
      const counts = await loadActiveServiceCounts();
      return items.map((c) => ({
        id: c.id,
        name: locale === "ar" ? c.nameAr : c.nameEn,
        Icon: resolveCategoryIcon(c.icon),
        count: counts.get(c.id) ?? 0,
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
    count: 0,
  }));
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const categories = await loadCategories(locale);
  return <Categories categories={categories} />;
}

function Categories({ categories }: { categories: ScreenCategory[] }) {
  const t = useTranslations("categoriesScreen");

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-4 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
      </header>

      <main className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {categories.map(({ id, name, Icon, count }) => (
          <button
            key={id}
            type="button"
            className="bg-card border-border hover:border-brand/40 flex w-full items-center gap-3 rounded-2xl border p-3 text-start shadow-sm transition-colors"
          >
            <span className="bg-brand-gradient grid size-12 shrink-0 place-items-center rounded-xl text-white">
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{name}</span>
              <span className="text-muted-foreground block text-xs">
                {t("services", { count })}
              </span>
            </span>
            <ChevronRight
              className="text-muted-foreground size-5 rtl:rotate-180"
              aria-hidden
            />
          </button>
        ))}
      </main>

      <BottomNav active="categories" />
    </div>
  );
}
