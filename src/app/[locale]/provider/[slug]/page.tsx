import { Plus, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { getProvidersService } from "@/features/providers";
import type { Provider } from "@/features/providers";
import { getReviewsService } from "@/features/reviews";
import type { Review } from "@/features/reviews";
import { StarRating } from "@/features/reviews/components/star-rating";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { Link } from "@/i18n/navigation";
import { NotFoundError } from "@/lib/errors";
import { cn, initials } from "@/lib/utils";

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

  let reviews: Review[] = [];
  try {
    ({ items: reviews } = await (
      await getReviewsService()
    ).list({
      page: 1,
      pageSize: 20,
      providerId: provider.id,
      status: "published",
    }));
  } catch {
    // Reviews are a nice-to-have on this page; render without them.
  }

  return (
    <ProviderProfile provider={provider} services={items} reviews={reviews} />
  );
}

function ProviderProfile({
  provider,
  services,
  reviews,
}: {
  provider: Provider;
  services: Service[];
  reviews: Review[];
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
                  <Link
                    href={`/booking?service=${svc.id}`}
                    aria-label={t("bookThis")}
                    className="bg-accent text-primary grid size-9 shrink-0 place-items-center rounded-full"
                  >
                    <Plus className="size-5" aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="space-y-3">
          <h2 className="font-heading font-bold">{t("reviewsTitle")}</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noReviews")}</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <article
                  key={r.id}
                  className="bg-card border-border space-y-1.5 rounded-2xl border p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <StarRating value={r.rating} />
                    <span className="text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-KW" : "en-KW",
                      )}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm whitespace-pre-line">{r.comment}</p>
                  )}
                  {r.providerReply && (
                    <p className="bg-muted/50 rounded-lg p-2 text-sm">
                      <span className="text-muted-foreground block text-xs">
                        {t("providerReply")}
                      </span>
                      {r.providerReply}
                    </p>
                  )}
                </article>
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
            <Link
              href={`/booking?service=${cheapest.id}`}
              className={cn(
                buttonVariants(),
                "bg-brand-gradient border-0 px-6 text-white shadow-md hover:opacity-90",
              )}
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
