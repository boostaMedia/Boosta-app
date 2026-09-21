import { Plus, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { Button } from "@/components/ui/button";
import { getProvidersService } from "@/features/providers";
import type { Provider } from "@/features/providers";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { NotFoundError } from "@/lib/errors";
import { initials } from "@/lib/utils";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const providers = await getProvidersService();
  let provider: Provider;
  try {
    provider = await providers.getBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  // Only verified providers get a public profile — pending/rejected/suspended
  // ones haven't cleared admin review or have been pulled from the platform.
  if (provider.status !== "verified") notFound();

  const services = await getServicesService();
  const { items } = await services.list({
    page: 1,
    pageSize: 50,
    providerId: provider.id,
    status: "active",
  });

  return <ProviderProfile provider={provider} services={items} />;
}

function ProviderProfile({
  provider,
  services,
}: {
  provider: Provider;
  services: Service[];
}) {
  const t = useTranslations("providerScreen");
  const locale = useLocale();
  const name =
    locale === "ar" ? provider.businessNameAr : provider.businessNameEn;
  const memberSinceYear = new Date(provider.createdAt).getFullYear();

  const stats = [
    { value: String(provider.reviewsCount), label: t("stats.reviews") },
    { value: String(services.length), label: t("stats.services") },
    { value: String(memberSinceYear), label: t("stats.since") },
  ];

  const cheapest = services.reduce<Service | null>(
    (min, s) => (min === null || s.basePrice < min.basePrice ? s : min),
    null,
  );

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <ScreenHeader title={name} backHref="/search" />

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Provider hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-brand-gradient grid size-20 place-items-center rounded-2xl text-2xl font-bold text-white shadow-md">
            {initials(name)}
          </div>
          <div>
            <h1 className="font-heading text-xl font-extrabold">{name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5 text-sm">
              <Star
                className="size-4 fill-amber-400 text-amber-400"
                aria-hidden
              />
              <span className="text-foreground font-semibold">
                {provider.rating.toFixed(1)}
              </span>
              <span>({t("reviews", { count: provider.reviewsCount })})</span>
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
          {services.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <p className="font-bold">{t("noServicesTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("noServicesSubtitle")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {locale === "ar" ? svc.titleAr : svc.titleEn}
                    </p>
                    <p className="text-primary text-sm font-bold">
                      {formatAmount(svc.basePrice, svc.currency)}{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        {currencySymbol(svc.currency, locale)}
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
          )}
        </section>
      </main>

      {/* Sticky book bar */}
      {cheapest !== null && (
        <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">
                {t("startingFrom")}{" "}
              </span>
              <span className="text-primary font-bold">
                {formatAmount(cheapest.basePrice, cheapest.currency)}{" "}
                {currencySymbol(cheapest.currency, locale)}
              </span>
            </div>
            <Button className="bg-brand-gradient border-0 px-6 text-white shadow-md hover:opacity-90">
              {t("bookNow")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
