import {
  CalendarCheck,
  Coins,
  Store,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import {
  getDashboardStats,
  getRecentActivity,
} from "@/features/admin/dashboard";
import type { ActivityItem, DashboardStats } from "@/features/admin/dashboard";
import { effectiveStatus, listInvoices, paidBetween } from "@/features/billing";
import { Link } from "@/i18n/navigation";
import { formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "admin-dashboard" });

interface MoneyKpis {
  monthRevenue: number;
  overdueCount: number;
  overdueAmount: number;
}

async function loadMoney(): Promise<MoneyKpis> {
  try {
    const invoices = await listInvoices();
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const overdue = invoices.filter(
      (i) => effectiveStatus(i, now) === "overdue",
    );
    return {
      monthRevenue: paidBetween(invoices, monthStart, nextMonth),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
    };
  } catch (error) {
    log.warn("money_kpis.failed", { error });
    return { monthRevenue: 0, overdueCount: 0, overdueAmount: 0 };
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, money, activity] = await Promise.all([
    getDashboardStats(),
    loadMoney(),
    getRecentActivity().catch(() => [] as ActivityItem[]),
  ]);
  return <Dashboard stats={stats} money={money} activity={activity} />;
}

function Kpi({
  label,
  value,
  hint,
  danger,
}: {
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={`font-heading mt-1 text-2xl font-extrabold ${danger ? "text-destructive" : ""}`}
      >
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

const ACTIVITY_ICONS: Record<ActivityItem["kind"], LucideIcon> = {
  provider: UserPlus,
  payment: Coins,
  booking: CalendarCheck,
};

function Dashboard({
  stats,
  money,
  activity,
}: {
  stats: DashboardStats;
  money: MoneyKpis;
  activity: ActivityItem[];
}) {
  const t = useTranslations("adminDashboard");
  const locale = useLocale();
  const max = Math.max(1, ...stats.subscriptionsByCountry.map((c) => c.count));

  const todo = [
    {
      key: "pendingProviders",
      count: stats.pendingProviders,
      href: "/admin/providers",
    },
    {
      key: "overdueInvoices",
      count: money.overdueCount,
      href: "/admin/finance",
    },
    { key: "expiringSoon", count: stats.expiringSoon, href: "/admin/finance" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label={t("activeSubscriptions")}
          value={String(stats.activeSubscriptions)}
        />
        <Kpi
          label={t("pendingProviders")}
          value={String(stats.pendingProviders)}
          hint={t("needsReview")}
        />
        <Kpi
          label={t("monthRevenue")}
          value={`${formatAmount(money.monthRevenue, "USD")} USD`}
        />
        <Kpi
          label={t("bookingsThisMonth")}
          value={String(stats.bookingsThisMonth)}
          hint={t("inProgress", { count: stats.bookingsInProgress })}
        />
        <Kpi
          label={t("verifiedProviders")}
          value={String(stats.verifiedProviders)}
          hint={t("suspended", { count: stats.suspendedProviders })}
        />
        <Kpi label={t("customers")} value={String(stats.customers)} />
        <Kpi
          label={t("expiringSoon")}
          value={String(stats.expiringSoon)}
          hint={t("expiringHint")}
        />
        <Kpi
          label={t("overdue")}
          value={String(money.overdueCount)}
          hint={`${formatAmount(money.overdueAmount, "USD")} USD`}
          danger={money.overdueCount > 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold">{t("byCountry")}</h2>
          {stats.subscriptionsByCountry.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("noSubscriptions")}
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.subscriptionsByCountry.map((c) => (
                <li
                  key={c.countryId}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-24 shrink-0 truncate">
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </span>
                  <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-primary block h-2 rounded-full"
                      style={{ width: `${(c.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-end font-medium">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold">{t("todoTitle")}</h2>
          <ul className="space-y-2">
            {todo.map(({ key, count, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2 text-sm"
                >
                  <span>{t(`todo.${key}`, { count })}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      count > 0
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-card border-border rounded-2xl border p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Store className="size-4" aria-hidden />
          {t("recent")}
        </h2>
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
        ) : (
          <ul className="divide-border divide-y">
            {activity.map((item, i) => {
              const Icon = ACTIVITY_ICONS[item.kind];
              return (
                <li key={i} className="flex items-center gap-3 py-2 text-sm">
                  <Icon className="text-primary size-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate">
                    {t(`activity.${item.kind}`, { label: item.label })}
                  </span>
                  <time
                    dateTime={item.at}
                    className="text-muted-foreground shrink-0 text-xs"
                  >
                    {new Date(item.at).toLocaleDateString(
                      locale === "ar" ? "ar-KW" : "en-KW",
                    )}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
