import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { requireCustomer } from "@/features/auth";
import { BookingForm } from "@/features/orders/components/booking-form";
import { getProvidersService } from "@/features/providers";
import type { Provider } from "@/features/providers";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { NotFoundError } from "@/lib/errors";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale } = await params;
  const { service: serviceId } = await searchParams;
  setRequestLocale(locale);
  await requireCustomer();
  if (!serviceId) notFound();

  let service: Service;
  let provider: Provider;
  try {
    service = await (await getServicesService()).get(serviceId);
    provider = await (await getProvidersService()).get(service.providerId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  // Only live services of verified providers can be booked.
  if (service.status !== "active" || provider.status !== "verified") {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "bookingScreen" });
  const isAr = locale === "ar";
  const title = isAr ? service.titleAr : service.titleEn;
  const providerName = isAr ? provider.businessNameAr : provider.businessNameEn;
  const price = formatAmount(service.basePrice, service.currency);
  const symbol = currencySymbol(service.currency, locale);

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <ScreenHeader
        title={t("title")}
        backHref={`/provider/${provider.slug}`}
      />

      <BookingForm serviceId={service.id}>
        <section className="bg-card border-border space-y-1 rounded-2xl border p-4 shadow-sm">
          <p className="font-bold">{title}</p>
          <p className="text-muted-foreground text-sm">{providerName}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold">{t("invoice")}</h2>
          <div className="bg-card border-border space-y-2.5 rounded-2xl border p-4 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("servicePrice")}</span>
              <span className="font-medium">{price}</span>
            </div>
            <div className="border-border flex justify-between border-t pt-2.5 font-bold">
              <span>{t("total")}</span>
              <span className="text-primary">
                {price} <span className="text-xs font-normal">{symbol}</span>
              </span>
            </div>
          </div>
        </section>
      </BookingForm>
    </div>
  );
}
