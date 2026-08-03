import { Plus, ShieldCheck, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { Button } from "@/components/ui/button";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProviderProfile />;
}

// Placeholder provider — real data comes from /api/providers/:id + /api/services.
const DATA = {
  en: {
    name: "Pixel Studio",
    initials: "PX",
    services: [
      { name: "Social Media Content Package", price: "45.000" },
      { name: "Product Photography (session)", price: "60.000" },
      { name: "Reels & Short Video Editing", price: "35.000" },
    ],
  },
  ar: {
    name: "بيكسل ستوديو",
    initials: "بك",
    services: [
      { name: "باقة محتوى سوشيال ميديا", price: "45.000" },
      { name: "تصوير المنتجات (بالجلسة)", price: "60.000" },
      { name: "مونتاج ريلز وفيديوهات قصيرة", price: "35.000" },
    ],
  },
} as const;

function ProviderProfile() {
  const t = useTranslations("providerScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";
  const data = locale === "ar" ? DATA.ar : DATA.en;

  const stats = [
    { value: "1.2k+", label: t("stats.bookings") },
    { value: "6", label: t("stats.years") },
    { value: "96%", label: t("stats.acceptance") },
  ];

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      <ScreenHeader title={data.name} backHref="/search" />

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Provider hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-brand-gradient grid size-20 place-items-center rounded-2xl text-2xl font-bold text-white shadow-md">
            {data.initials}
          </div>
          <div>
            <h1 className="font-heading text-xl font-extrabold">{data.name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5 text-sm">
              <Star
                className="size-4 fill-amber-400 text-amber-400"
                aria-hidden
              />
              <span className="text-foreground font-semibold">4.7</span>
              <span>({t("reviews", { count: 340 })})</span>
              <span aria-hidden>·</span>
              <span className="text-success inline-flex items-center gap-1 font-medium">
                <ShieldCheck className="size-4" aria-hidden />
                {t("verified")}
              </span>
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card border-border rounded-2xl border p-3 text-center shadow-sm"
            >
              <p className="font-heading text-lg font-extrabold">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Services */}
        <section className="space-y-3">
          <h2 className="font-heading font-bold">{t("services")}</h2>
          <div className="space-y-2">
            {data.services.map((svc) => (
              <div
                key={svc.name}
                className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{svc.name}</p>
                  <p className="text-primary text-sm font-bold">
                    {svc.price}{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      {currency}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Add"
                  className="bg-accent text-primary grid size-9 shrink-0 place-items-center rounded-full"
                >
                  <Plus className="size-5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky book bar */}
      <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">{t("startingFrom")} </span>
            <span className="text-primary font-bold">35.000 {currency}</span>
          </div>
          <Button className="bg-brand-gradient border-0 px-6 text-white shadow-md hover:opacity-90">
            {t("bookNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
