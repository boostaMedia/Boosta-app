import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { requireUser } from "@/features/auth";
import { getOrdersService } from "@/features/orders";
import type { Order } from "@/features/orders";
import { BookingActions } from "@/features/orders/components/booking-actions";
import { OrderStatusPill } from "@/features/orders/components/order-status-pill";
import { nextStatuses, tabForStatus } from "@/features/orders/transitions";
import type { BookingTab } from "@/features/orders/transitions";
import { getProvidersService } from "@/features/providers";
import { getReviewsService } from "@/features/reviews";
import type { Review } from "@/features/reviews";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { StarRating } from "@/features/reviews/components/star-rating";
import type { Provider } from "@/features/providers";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { Link } from "@/i18n/navigation";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { cn, initials } from "@/lib/utils";

const log = logger.child({ module: "bookings-screen" });

const TABS: BookingTab[] = ["upcoming", "completed", "cancelled"];

function isTab(value: string | undefined): value is BookingTab {
  return TABS.includes(value as BookingTab);
}

type BookingRow = {
  order: Order;
  serviceTitleEn: string;
  serviceTitleAr: string;
  provider: Provider | null;
  review: Review | null;
};

async function loadBookings(customerId: string): Promise<BookingRow[]> {
  try {
    const orders = await getOrdersService();
    const { items } = await orders.list({
      page: 1,
      pageSize: 50,
      customerId,
    });
    if (items.length === 0) return [];

    const services = await getServicesService();
    const serviceIds = [
      ...new Set(items.map((o) => o.serviceId).filter((id) => id !== null)),
    ];
    const serviceById = new Map<string, Service>();
    await Promise.all(
      serviceIds.map(async (id) => {
        try {
          serviceById.set(id, await services.get(id));
        } catch {
          // A removed service just falls back to the order number below.
        }
      }),
    );

    const providers = await getProvidersService();
    const providerById = new Map(
      (
        await providers.listByIds([...new Set(items.map((o) => o.providerId))])
      ).map((p) => [p.id, p]),
    );

    // The customer's own reviews, by booking, so completed bookings show
    // either their rating or the form to leave one.
    const reviewByOrder = new Map<string, Review>();
    try {
      const { items: reviews } = await (
        await getReviewsService()
      ).list({ page: 1, pageSize: 100, customerId });
      for (const r of reviews) if (r.orderId) reviewByOrder.set(r.orderId, r);
    } catch (error) {
      log.warn("bookings.reviews_load_failed", { error });
    }

    return items.map((order) => {
      const service = order.serviceId ? serviceById.get(order.serviceId) : null;
      return {
        order,
        serviceTitleEn: service?.titleEn ?? order.orderNumber,
        serviceTitleAr: service?.titleAr ?? order.orderNumber,
        provider: providerById.get(order.providerId) ?? null,
        review: reviewByOrder.get(order.id) ?? null,
      };
    });
  } catch (error) {
    log.warn("bookings.load_failed", { error });
    return [];
  }
}

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab: tabParam } = await searchParams;
  setRequestLocale(locale);
  const user = await requireUser();

  const tab: BookingTab = isTab(tabParam) ? tabParam : "upcoming";
  const rows = (await loadBookings(user.id)).filter(
    (r) => tabForStatus(r.order.status) === tab,
  );

  return <Bookings rows={rows} activeTab={tab} />;
}

function Bookings({
  rows,
  activeTab,
}: {
  rows: BookingRow[];
  activeTab: BookingTab;
}) {
  const t = useTranslations("bookingsScreen");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
        <div className="mt-3 flex gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab}
              href={`/bookings?tab=${tab}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold",
                tab === activeTab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground border font-medium",
              )}
            >
              {t(`tabs.${tab}`)}
            </Link>
          ))}
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4">
        {rows.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          rows.map(
            ({ order, serviceTitleEn, serviceTitleAr, provider, review }) => {
              const providerName = provider
                ? isAr
                  ? provider.businessNameAr
                  : provider.businessNameEn
                : "";
              return (
                <article
                  key={order.id}
                  className="bg-card border-border rounded-2xl border p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      {order.scheduledAt
                        ? new Date(order.scheduledAt).toLocaleString(
                            isAr ? "ar-KW" : "en-KW",
                            { dateStyle: "medium", timeStyle: "short" },
                          )
                        : t("noDate")}
                    </span>
                    <OrderStatusPill status={order.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">
                      {initials(providerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {isAr ? serviceTitleAr : serviceTitleEn}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {providerName}
                      </p>
                    </div>
                    <p className="text-primary shrink-0 text-end text-sm font-bold">
                      {formatAmount(order.totalAmount, order.currency)}
                      <span className="text-muted-foreground block text-[10px] font-normal">
                        {currencySymbol(order.currency, locale)}
                      </span>
                    </p>
                  </div>
                  <BookingActions
                    orderId={order.id}
                    options={nextStatuses("customer", order.status)}
                  />
                  {order.status === "completed" &&
                    (review ? (
                      <div className="border-border mt-3 space-y-1 border-t pt-3">
                        <StarRating value={review.rating} />
                        {review.comment && (
                          <p className="text-sm whitespace-pre-line">
                            {review.comment}
                          </p>
                        )}
                        {review.providerReply && (
                          <p className="bg-muted/50 rounded-lg p-2 text-sm">
                            <span className="text-muted-foreground block text-xs">
                              {t("providerReply")}
                            </span>
                            {review.providerReply}
                          </p>
                        )}
                      </div>
                    ) : (
                      <ReviewForm orderId={order.id} />
                    ))}
                </article>
              );
            },
          )
        )}
      </main>

      <BottomNav active="bookings" />
    </div>
  );
}
