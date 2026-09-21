import { redirect } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ProviderBottomNav } from "@/components/app/provider-bottom-nav";
import { requireProvider } from "@/features/auth";
import { getOrdersService } from "@/features/orders";
import type { Order } from "@/features/orders";
import { BookingActions } from "@/features/orders/components/booking-actions";
import { OrderStatusPill } from "@/features/orders/components/order-status-pill";
import { nextStatuses } from "@/features/orders/transitions";
import { getCurrentProvider } from "@/features/providers";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "provider-bookings-screen" });

type Row = { order: Order; service: Service | null };

async function loadRows(providerId: string): Promise<Row[]> {
  try {
    const { items } = await (
      await getOrdersService()
    ).list({ page: 1, pageSize: 50, providerId });

    const services = await getServicesService();
    const byId = new Map<string, Service>();
    await Promise.all(
      [
        ...new Set(items.map((o) => o.serviceId).filter((id) => id !== null)),
      ].map(async (id) => {
        try {
          byId.set(id, await services.get(id));
        } catch {
          // Removed service: fall back to the order number.
        }
      }),
    );
    return items.map((order) => ({
      order,
      service: order.serviceId ? (byId.get(order.serviceId) ?? null) : null,
    }));
  } catch (error) {
    log.warn("provider_bookings.load_failed", { error });
    return [];
  }
}

export default async function ProviderBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProvider();

  const provider = await getCurrentProvider();
  if (!provider || provider.status !== "verified") {
    redirect(`/${locale}/dashboard`);
  }

  return <ProviderBookings rows={await loadRows(provider.id)} />;
}

function ProviderBookings({ rows }: { rows: Row[] }) {
  const t = useTranslations("providerBookingsScreen");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground text-xs">{t("subtitle")}</p>
      </header>

      <main className="flex-1 space-y-3 px-4 py-2">
        {rows.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          rows.map(({ order, service }) => (
            <article
              key={order.id}
              className="bg-card border-border rounded-2xl border p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium" dir="ltr">
                  #{order.orderNumber}
                </span>
                <OrderStatusPill status={order.status} />
              </div>
              <p className="font-bold">
                {service
                  ? isAr
                    ? service.titleAr
                    : service.titleEn
                  : order.orderNumber}
              </p>
              <p className="text-muted-foreground text-sm">
                {order.scheduledAt
                  ? new Date(order.scheduledAt).toLocaleString(
                      isAr ? "ar-KW" : "en-KW",
                      { dateStyle: "medium", timeStyle: "short" },
                    )
                  : t("noDate")}
              </p>
              {order.notes && (
                <p className="bg-muted/50 mt-2 rounded-lg p-2 text-sm whitespace-pre-line">
                  {order.notes}
                </p>
              )}
              <p className="text-primary mt-2 text-sm font-bold">
                {formatAmount(order.totalAmount, order.currency)}{" "}
                {currencySymbol(order.currency, locale)}
              </p>
              <BookingActions
                orderId={order.id}
                options={nextStatuses("provider", order.status)}
              />
            </article>
          ))
        )}
      </main>

      <ProviderBottomNav active="orders" />
    </div>
  );
}
