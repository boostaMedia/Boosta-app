import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Categories />;
}

const FILTERS = ["all", "home", "cars", "beauty"] as const;

const CATEGORIES = [
  { key: "cleaning", emoji: "🧹", count: 128 },
  { key: "plumbing", emoji: "🔧", count: 64 },
  { key: "electrical", emoji: "💡", count: 51 },
  { key: "ac", emoji: "❄️", count: 39 },
  { key: "painting", emoji: "🎨", count: 27 },
  { key: "carWash", emoji: "🚗", count: 83 },
] as const;

function Categories() {
  const t = useTranslations("categoriesScreen");
  const tCat = useTranslations("customerHome.cat");

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              type="button"
              className={
                i === 0
                  ? "bg-primary text-primary-foreground shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold"
                  : "bg-card border-border text-muted-foreground shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium"
              }
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 pt-3 pb-6">
        {CATEGORIES.map(({ key, emoji, count }) => (
          <button
            key={key}
            type="button"
            className="bg-card border-border hover:border-brand/40 flex w-full items-center gap-3 rounded-2xl border p-3 text-start shadow-sm transition-colors"
          >
            <span className="bg-accent grid size-12 shrink-0 place-items-center rounded-xl text-2xl">
              {emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{tCat(key)}</span>
              <span className="text-muted-foreground block text-xs">
                {t("providers", { count })}
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
