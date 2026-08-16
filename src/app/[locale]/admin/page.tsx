import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/features/auth";
import { getProvidersService } from "@/features/providers";
import type { Provider, ProviderStatus } from "@/features/providers";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS: ProviderStatus[] = ["pending", "verified", "rejected", "suspended"];

const STATUS_CLASSES: Record<ProviderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  verified: "bg-success/12 text-success",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-muted text-muted-foreground",
};

function isProviderStatus(value: string | undefined): value is ProviderStatus {
  return TABS.includes(value as ProviderStatus);
}

export default async function AdminProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status: statusParam } = await searchParams;
  setRequestLocale(locale);
  await requireAdmin();

  const status: ProviderStatus = isProviderStatus(statusParam)
    ? statusParam
    : "pending";

  const service = await getProvidersService();
  const { items, total } = await service.list({
    page: 1,
    pageSize: 50,
    featured: false,
    status,
  });

  return (
    <AdminProvidersList providers={items} total={total} activeStatus={status} />
  );
}

function AdminProvidersList({
  providers,
  total,
  activeStatus,
}: {
  providers: Provider[];
  total: number;
  activeStatus: ProviderStatus;
}) {
  const t = useTranslations("adminProvidersScreen");
  const locale = useLocale();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8">
      <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${s}`)}
          </Link>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {providers.length === 0 ? (
          <div className="bg-card border-border rounded-xl border p-6 text-center shadow-sm">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          providers.map((p) => {
            const name = locale === "ar" ? p.businessNameAr : p.businessNameEn;
            return (
              <Link
                key={p.id}
                href={`/admin/providers/${p.id}`}
                className="bg-card hover:border-brand/40 flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{name}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(p.createdAt).toLocaleDateString(
                      locale === "ar" ? "ar-KW" : "en-KW",
                    )}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_CLASSES[p.status],
                  )}
                >
                  {t(`status.${p.status}`)}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {total > providers.length && (
        <p className="text-muted-foreground mt-4 text-center text-xs">
          {t("showingCount", { shown: providers.length, total })}
        </p>
      )}
    </div>
  );
}
