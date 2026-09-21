import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Star,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ProviderBottomNav } from "@/components/app/provider-bottom-nav";
import { requireProvider } from "@/features/auth";
import { getOrdersService } from "@/features/orders";
import type { Order } from "@/features/orders";
import { BookingActions } from "@/features/orders/components/booking-actions";
import { summarizeProviderOrders } from "@/features/orders/provider-stats";
import type { ProviderOrderSummary } from "@/features/orders/provider-stats";
import { nextStatuses } from "@/features/orders/transitions";
import { getCurrentProvider } from "@/features/providers";
import type { Provider } from "@/features/providers";
import { PendingApprovalScreen } from "@/features/providers/components/pending-approval";
import { RegisterProviderForm } from "@/features/providers/components/register-form";
import { listCities, listCountries } from "@/features/reference";
import { getServicesService } from "@/features/services";
import { Link } from "@/i18n/navigation";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "provider-dashboard" });

type Request = { order: Order; titleEn: string; titleAr: string };

const EMPTY_SUMMARY: ProviderOrderSummary = {
  bookingsThisMonth: 0,
  completedTotal: 0,
  revenueThisMonth: [],
  pendingRequests: [],
};

async function loadDashboard(
  providerId: string,
): Promise<{ summary: ProviderOrderSummary; requests: Request[] }> {
  try {
    const { items } = await (
      await getOrdersService()
    ).list({ page: 1, pageSize: 100, providerId });
    const summary = summarizeProviderOrders(items, new Date());

    const services = await getServicesService();
    const requests = await Promise.all(
      summary.pendingRequests.slice(0, 3).map(async (order) => {
        let titleEn: string = order.orderNumber;
        let titleAr: string = order.orderNumber;
        if (order.serviceId) {
          try {
            const service = await services.get(order.serviceId);
            titleEn = service.titleEn;
            titleAr = service.titleAr;
          } catch {
            // Removed service: keep the order number.
          }
        }
        return { order, titleEn, titleAr };
      }),
    );
    return { summary, requests };
  } catch (error) {
    log.warn("dashboard.load_failed", { error });
    return { summary: EMPTY_SUMMARY, requests: [] };
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProvider();

  // A provider-role account has no `providers` row until they complete this
  // one-time registration request — show that instead of the stats. Having a
  // row isn't the same as being approved: only status='verified' gets the real
  // dashboard, everything else (pending, rejected, suspended) sees the
  // matching status screen.
  const provider = await getCurrentProvider();
  if (!provider) {
    const [cities, countries] = await Promise.all([
      listCities(),
      listCountries(),
    ]);
    return <RegisterProviderForm cities={cities} countries={countries} />;
  }
  if (provider.status !== "verified") {
    return (
      <PendingApprovalScreen
        status={provider.status}
        businessNameEn={provider.businessNameEn}
        businessNameAr={provider.businessNameAr}
      />
    );
  }

  const { summary, requests } = await loadDashboard(provider.id);
  return (
    <Dashboard provider={provider} summary={summary} requests={requests} />
  );
}

function Dashboard({
  provider,
  summary,
  requests,
}: {
  provider: Provider;
  summary: ProviderOrderSummary;
  requests: Request[];
}) {
  const t = useTranslations("dashboardScreen");
  const locale = useLocale();
  const isAr = locale === "ar";
  const name = isAr ? provider.businessNameAr : provider.businessNameEn;
  const initial = name.trim().charAt(0).toUpperCase() || "B";

  const revenue =
    summary.revenueThisMonth.length === 0
      ? "0"
      : summary.revenueThisMonth
          .map(
            (r) =>
              `${formatAmount(r.amount, r.currency)} ${currencySymbol(r.currency, locale)}`,
          )
          .join(" + ");

  const stats = [
    {
      key: "bookingsThisMonth",
      value: String(summary.bookingsThisMonth),
      Icon: CalendarDays,
    },
    { key: "revenue", value: revenue, Icon: Wallet },
    { key: "rating", value: provider.rating.toFixed(1), Icon: Star },
    {
      key: "completed",
      value: String(summary.completedTotal),
      Icon: CheckCircle2,
    },
  ] as const;

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Header */}
      <header className="bg-brand-gradient rounded-b-3xl px-4 pt-6 pb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-white/15 text-sm font-bold backdrop-blur">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white/80">{t("welcome")}</p>
            <p className="font-heading truncate text-lg font-extrabold">
              {name}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ key, value, Icon }) => (
            <div
              key={key}
              className="bg-card border-border rounded-2xl border p-4 shadow-sm"
            >
              <Icon className="text-primary mb-2 size-5" aria-hidden />
              <p className="font-heading text-xl font-extrabold break-words">
                {value}
              </p>
              <p className="text-muted-foreground text-xs">
                {t(`stats.${key}`)}
              </p>
            </div>
          ))}
        </div>

        {/* Services */}
        <Link
          href="/dashboard/services"
          className="bg-card hover:border-brand/40 flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-colors"
        >
          <span className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-white">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t("myServices")}</span>
            <span className="text-muted-foreground block text-xs">
              {t("myServicesSubtitle")}
            </span>
          </span>
          <ChevronRight
            className="text-muted-foreground size-5 shrink-0 rtl:rotate-180"
            aria-hidden
          />
        </Link>

        {/* New requests */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold">{t("newRequests")}</h2>
            {summary.pendingRequests.length > requests.length && (
              <Link
                href="/dashboard/bookings"
                className="text-primary text-sm font-medium"
              >
                {t("seeAll", { count: summary.pendingRequests.length })}
              </Link>
            )}
          </div>
          {requests.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
              <p className="font-bold">{t("noRequestsTitle")}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("noRequestsSubtitle")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map(({ order, titleEn, titleAr }) => (
                <div
                  key={order.id}
                  className="bg-card border-border rounded-2xl border p-4 shadow-sm"
                >
                  <p className="truncate font-medium">
                    {isAr ? titleAr : titleEn}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {order.scheduledAt
                      ? new Date(order.scheduledAt).toLocaleString(
                          isAr ? "ar-KW" : "en-KW",
                          { dateStyle: "medium", timeStyle: "short" },
                        )
                      : t("noDate")}
                  </p>
                  <BookingActions
                    orderId={order.id}
                    options={nextStatuses("provider", order.status)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ProviderBottomNav active="dashboard" />
    </div>
  );
}
