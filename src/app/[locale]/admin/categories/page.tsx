import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { getCategoriesService } from "@/features/categories";
import { CategoryManager } from "@/features/categories/components/category-manager";
import type { ManagedCategory } from "@/features/categories/components/category-manager";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const log = logger.child({ module: "admin-categories" });

async function loadCategories(): Promise<ManagedCategory[]> {
  try {
    const { items } = await (
      await getCategoriesService()
    ).list({ page: 1, pageSize: 100, activeOnly: false });

    const supabase = await createClient();
    const { data } = await supabase
      .from("services")
      .select("category_id")
      .is("deleted_at", null)
      .limit(5000);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { category_id: string }[]) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }

    return items.map((c) => ({
      id: c.id,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      isActive: c.isActive,
      servicesCount: counts.get(c.id) ?? 0,
    }));
  } catch (error) {
    log.warn("categories.load_failed", { error });
    return [];
  }
}

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Categories categories={await loadCategories()} />;
}

function Categories({ categories }: { categories: ManagedCategory[] }) {
  const t = useTranslations("adminCategories");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
