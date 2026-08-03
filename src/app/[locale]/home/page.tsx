import {
  Bell,
  Camera,
  ChevronDown,
  MapPin,
  PenTool,
  Search,
  Star,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { CATEGORY_ITEMS } from "@/config/categories";

export default async function CustomerHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CustomerHome />;
}

const SERVICES = [
  {
    key: "s1",
    provider: "s1Provider",
    rating: "4.8",
    price: "45.000",
    Icon: PenTool,
  },
  {
    key: "s2",
    provider: "s2Provider",
    rating: "4.6",
    price: "60.000",
    Icon: Camera,
  },
] as const;

function CustomerHome() {
  const t = useTranslations("customerHome");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";
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
            {CATEGORY_ITEMS.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span className="bg-brand-gradient grid size-16 place-items-center rounded-2xl text-white shadow-sm">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span className="w-full truncate text-center text-xs font-medium">
                  {t(`cat.${key}`)}
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
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(({ key, provider, rating, price, Icon }) => (
              <article
                key={key}
                className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm"
              >
                <div className="bg-brand-gradient grid h-24 place-items-center text-white">
                  <Icon className="size-10" aria-hidden />
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="truncate text-sm font-bold">
                    {t(`svc.${key}`)}
                  </h3>
                  <p className="text-muted-foreground truncate text-xs">
                    {t(`svc.${provider}`)}
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
            ))}
          </div>
        </section>
      </main>

      <BottomNav active="home" />
    </div>
  );
}
