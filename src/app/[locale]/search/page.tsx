import { SlidersHorizontal, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { cn } from "@/lib/utils";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SearchResults />;
}

const SORTS = ["sortNearest", "sortTopRated", "sortPrice"] as const;

// Placeholder listings — real data comes from /api/services & /api/providers.
const PROVIDERS_EN = [
  {
    initials: "SA",
    name: "Sara Cleaning Co.",
    available: true,
    rating: "4.7",
    reviews: 340,
    km: "2.1",
    price: "18.500",
  },
  {
    initials: "AH",
    name: "Ahmad Home Services",
    available: false,
    rating: "4.9",
    reviews: 512,
    km: "3.4",
    price: "22.000",
  },
  {
    initials: "GC",
    name: "Gulf Cleaning",
    available: true,
    rating: "4.5",
    reviews: 201,
    km: "1.2",
    price: "15.750",
  },
];
const PROVIDERS_AR = [
  {
    initials: "سا",
    name: "شركة سارة للتنظيف",
    available: true,
    rating: "4.7",
    reviews: 340,
    km: "2.1",
    price: "18.500",
  },
  {
    initials: "أح",
    name: "أحمد للخدمات المنزلية",
    available: false,
    rating: "4.9",
    reviews: 512,
    km: "3.4",
    price: "22.000",
  },
  {
    initials: "نظ",
    name: "نظافة الخليج",
    available: true,
    rating: "4.5",
    reviews: 201,
    km: "1.2",
    price: "15.750",
  },
];

function SearchResults() {
  const t = useTranslations("searchScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";
  const providers = locale === "ar" ? PROVIDERS_AR : PROVIDERS_EN;

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      <ScreenHeader title={t("title")} backHref="/categories" />

      {/* Sort + filter row */}
      <div className="border-border flex items-center gap-2 overflow-x-auto border-b px-4 py-2.5">
        {SORTS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground border",
            )}
          >
            {t(s)}
          </button>
        ))}
        <button
          type="button"
          className="bg-card border-border ms-auto flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("filter")}
        </button>
      </div>

      <main className="flex-1 space-y-3 px-4 py-4">
        {providers.map((p) => (
          <article
            key={p.name}
            className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3 shadow-sm"
          >
            <div className="bg-brand-gradient grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">
              {p.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-bold">{p.name}</h2>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    p.available
                      ? "bg-success/12 text-success"
                      : "bg-warning/15 text-warning",
                  )}
                >
                  {t(p.available ? "available" : "busy")}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Star
                  className="size-3.5 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                <span className="text-foreground font-medium">{p.rating}</span>
                <span>({t("reviews", { count: p.reviews })})</span>
                <span aria-hidden>·</span>
                <span>{t("km", { km: p.km })}</span>
              </p>
            </div>
            <div className="text-primary shrink-0 text-end text-sm font-bold">
              {p.price}
              <span className="text-muted-foreground block text-[10px] font-normal">
                {currency}
              </span>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
