import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import {
  effectiveStatus,
  listInvoices,
  monthlyRevenue,
  paidBetween,
} from "@/features/billing";
import type { EffectiveStatus, InvoiceWithProvider } from "@/features/billing";
import { InvoiceActions } from "@/features/billing/components/invoice-actions";
import { listCountries } from "@/features/reference";
import type { Country } from "@/features/reference";
import { Link } from "@/i18n/navigation";
import { formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const log = logger.child({ module: "admin-finance" });

const FILTERS = ["all", "due", "overdue", "paid", "void"] as const;
type Filter = (typeof FILTERS)[number];

function isFilter(value: string | undefined): value is Filter {
  return FILTERS.includes(value as Filter);
}

const PILL: Record<EffectiveStatus, string> = {
  paid: "bg-success/12 text-success",
  due: "bg-warning/15 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  void: "bg-muted text-muted-foreground",
};

export default async function AdminFinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; country?: string }>;
}) {
  const { locale } = await params;
  const { status, country } = await searchParams;
  setRequestLocale(locale);

  let invoices: InvoiceWithProvider[] = [];
  let countries: Country[] = [];
  try {
    [invoices, countries] = await Promise.all([
      listInvoices(),
      listCountries().catch(() => []),
    ]);
  } catch (error) {
    log.warn("finance.load_failed", { error });
  }

  return (
    <Finance
      invoices={invoices}
      countries={countries}
      filter={isFilter(status) ? status : "all"}
      countryFilter={country ?? null}
    />
  );
}

function Finance({
  invoices,
  countries,
  filter,
  countryFilter,
}: {
  invoices: InvoiceWithProvider[];
  countries: Country[];
  filter: Filter;
  countryFilter: string | null;
}) {
  const t = useTranslations("adminFinance");
  const locale = useLocale();
  const isAr = locale === "ar";
  const now = new Date();
  const fmt = (n: number) => `${formatAmount(n, "USD")} USD`;
  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(isAr ? "ar-KW" : "en-KW");

  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const nextYear = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const open = invoices.filter((i) => i.status === "due");
  const overdue = open.filter((i) => effectiveStatus(i, now) === "overdue");
  const upcoming = open.filter((i) => effectiveStatus(i, now) === "due");
  const sum = (list: InvoiceWithProvider[]) =>
    list.reduce((s, i) => s + i.amount, 0);

  const series = monthlyRevenue(invoices, now, 6);
  const peak = Math.max(1, ...series.map((m) => m.total));
  const monthLabel = (key: string) =>
    new Date(`${key}-01T00:00:00Z`).toLocaleDateString(
      isAr ? "ar-KW" : "en-US",
      { month: "short", timeZone: "UTC" },
    );

  const countryName = new Map(
    countries.map((c) => [c.id, isAr ? c.nameAr : c.nameEn]),
  );
  const paidByCountry = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const key = inv.countryId ?? "";
    paidByCountry.set(key, (paidByCountry.get(key) ?? 0) + inv.amount);
  }

  const rows = invoices.filter((i) => {
    if (countryFilter && i.countryId !== countryFilter) return false;
    if (filter === "all") return true;
    return effectiveStatus(i, now) === filter;
  });

  const href = (f: Filter, c: string | null) => {
    const q = new URLSearchParams();
    if (f !== "all") q.set("status", f);
    if (c) q.set("country", c);
    const s = q.toString();
    return s ? `/admin/finance?${s}` : "/admin/finance";
  };

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "border-border text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        {/* File download from an API route, not a page: a plain anchor is right. */}
        <a
          href="/api/admin/invoices/export"
          download
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Download className="size-4" aria-hidden />
          {t("exportCsv")}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            k: "yearRevenue",
            v: fmt(paidBetween(invoices, yearStart, nextYear)),
          },
          {
            k: "monthCollected",
            v: fmt(paidBetween(invoices, monthStart, nextMonth)),
          },
          {
            k: "upcoming",
            v: fmt(sum(upcoming)),
            h: t("invoicesCount", { count: upcoming.length }),
          },
          {
            k: "overdue",
            v: fmt(sum(overdue)),
            h: t("invoicesCount", { count: overdue.length }),
            d: overdue.length > 0,
          },
        ].map(({ k, v, h, d }) => (
          <div
            key={k}
            className="bg-card border-border rounded-2xl border p-4 shadow-sm"
          >
            <p className="text-muted-foreground text-xs">{t(k)}</p>
            <p
              className={cn(
                "font-heading mt-1 text-xl font-extrabold",
                d && "text-destructive",
              )}
            >
              {v}
            </p>
            {h && <p className="text-muted-foreground mt-0.5 text-xs">{h}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold">{t("monthly")}</h2>
          <div
            className="flex h-28 items-end gap-3"
            role="img"
            aria-label={t("monthly")}
          >
            {series.map((m) => (
              <div
                key={m.month}
                className="flex flex-1 flex-col items-center gap-1 text-[11px]"
              >
                <span className="text-muted-foreground">
                  {m.total > 0 ? Math.round(m.total) : ""}
                </span>
                <div
                  className="bg-primary/70 w-full rounded-t"
                  style={{ height: `${Math.max(2, (m.total / peak) * 72)}px` }}
                />
                <span className="text-muted-foreground">
                  {monthLabel(m.month)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold">{t("byCountry")}</h2>
          {paidByCountry.size === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noPayments")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...paidByCountry]
                .sort((a, b) => b[1] - a[1])
                .map(([id, total]) => (
                  <li key={id} className="flex justify-between">
                    <span>{countryName.get(id) ?? t("unknownCountry")}</span>
                    <span className="font-medium">{fmt(total)}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">{t("invoices")}</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={href(f, countryFilter)}
              className={chip(filter === f)}
            >
              {t(`filters.${f}`)}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href={href(filter, null)}
            className={chip(countryFilter === null)}
          >
            {t("allCountries")}
          </Link>
          {countries.map((c) => (
            <Link
              key={c.id}
              href={href(filter, c.id)}
              className={chip(countryFilter === c.id)}
            >
              {isAr ? c.nameAr : c.nameEn}
            </Link>
          ))}
        </div>

        <div className="bg-card border-border overflow-x-auto rounded-2xl border shadow-sm">
          {rows.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              {t("empty")}
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr className="border-border border-b">
                  {["provider", "country", "amount", "due", "status", ""].map(
                    (h) => (
                      <th key={h} className="p-3 text-start font-normal">
                        {h && t(`cols.${h}`)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {rows.map((inv) => {
                  const st = effectiveStatus(inv, now);
                  return (
                    <tr key={inv.id}>
                      <td className="p-3 font-medium">
                        {isAr ? inv.providerNameAr : inv.providerNameEn}
                      </td>
                      <td className="p-3">
                        {countryName.get(inv.countryId ?? "") ?? "—"}
                      </td>
                      <td className="p-3">
                        {formatAmount(inv.amount, inv.currency)} {inv.currency}
                      </td>
                      <td className="p-3">
                        {inv.paidAt ? dateFmt(inv.paidAt) : dateFmt(inv.dueAt)}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            PILL[st],
                          )}
                        >
                          {t(`status.${st}`)}
                        </span>
                        {inv.status === "paid" && inv.paymentMethod && (
                          <span className="text-muted-foreground ms-2 text-xs">
                            {inv.paymentMethod}
                            {inv.reference ? ` · ${inv.reference}` : ""}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {inv.status === "due" && (
                          <InvoiceActions invoiceId={inv.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{t("manualNote")}</p>
      </section>
    </div>
  );
}
