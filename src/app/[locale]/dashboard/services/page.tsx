import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ProviderBottomNav } from "@/components/app/provider-bottom-nav";
import { requireProvider } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { Link } from "@/i18n/navigation";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const log = logger.child({ module: "provider-services-screen" });

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-success/12 text-success",
  draft: "bg-warning/15 text-warning",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

async function loadMyServices(providerId: string): Promise<Service[]> {
  try {
    const services = await getServicesService();
    const { items } = await services.list({
      page: 1,
      pageSize: 50,
      providerId,
    });
    return items;
  } catch (error) {
    log.warn("services.load_failed", { error });
    return [];
  }
}

export default async function ProviderServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProvider();

  const providerId = await getCurrentProviderId();
  if (!providerId) redirect(`/${locale}/dashboard`);

  const services = await loadMyServices(providerId);
  return <ServicesList services={services} />;
}

function ServicesList({ services }: { services: Service[] }) {
  const t = useTranslations("providerServicesScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center justify-between px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
        <Link
          href="/dashboard/services/new"
          className="bg-brand-gradient flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <Plus className="size-4" aria-hidden />
          {t("addService")}
        </Link>
      </header>

      <main className="flex-1 space-y-2 px-4 py-2">
        {services.length === 0 ? (
          <div className="bg-card hover:border-brand/40 mt-2 flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors">
            <span>
              <span className="block text-sm font-semibold">
                {t("emptyTitle")}
              </span>
              <span className="text-muted-foreground block text-xs">
                {t("emptySubtitle")}
              </span>
            </span>
          </div>
        ) : (
          services.map((s) => {
            const title = locale === "ar" ? s.titleAr : s.titleEn;
            return (
              <div
                key={s.id}
                className="bg-card border-border flex items-center gap-3 rounded-2xl border p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{title}</p>
                  <p className="text-muted-foreground text-xs">
                    {s.basePrice.toFixed(3)} {currency}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_CLASSES[s.status],
                  )}
                >
                  {t(`status.${s.status}`)}
                </span>
              </div>
            );
          })
        )}
      </main>

      <ProviderBottomNav active="dashboard" />
    </div>
  );
}
