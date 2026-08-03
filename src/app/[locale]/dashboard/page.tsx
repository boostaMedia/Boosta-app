import { CalendarDays, Star, TrendingUp, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ProviderBottomNav } from "@/components/app/provider-bottom-nav";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Dashboard />;
}

const REQUESTS = {
  en: [
    { title: "Social Media Content — 3 reels", when: "Tomorrow 11:00 AM" },
    { title: "Product Photography", when: "Thursday 2:00 PM" },
  ],
  ar: [
    { title: "محتوى سوشيال ميديا — ٣ ريلز", when: "غدًا ١١:٠٠ ص" },
    { title: "تصوير المنتجات", when: "الخميس ٢:٠٠ م" },
  ],
};

function Dashboard() {
  const t = useTranslations("dashboardScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";
  const requests = locale === "ar" ? REQUESTS.ar : REQUESTS.en;
  const initial = locale === "ar" ? "بك" : "PX";

  const stats = [
    { key: "todayBookings", value: "5", Icon: CalendarDays, suffix: "" },
    { key: "revenue", value: "142.750", Icon: Wallet, suffix: currency },
    { key: "rating", value: "4.7", Icon: Star, suffix: "" },
    { key: "acceptance", value: "96%", Icon: TrendingUp, suffix: "" },
  ] as const;

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Header */}
      <header className="bg-brand-gradient rounded-b-3xl px-4 pt-6 pb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-white/15 text-sm font-bold backdrop-blur">
            {initial}
          </div>
          <div>
            <p className="text-sm text-white/80">{t("welcome")}</p>
            <p className="font-heading flex items-center gap-2 text-lg font-extrabold">
              {t("studio")}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                <span className="size-1.5 rounded-full bg-green-300" />
                {t("online")}
              </span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ key, value, Icon, suffix }) => (
            <div
              key={key}
              className="bg-card border-border rounded-2xl border p-4 shadow-sm"
            >
              <Icon className="text-primary mb-2 size-5" aria-hidden />
              <p className="font-heading text-xl font-extrabold">
                {value}
                {suffix ? (
                  <span className="text-muted-foreground text-xs font-normal">
                    {" "}
                    {suffix}
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-xs">
                {t(`stats.${key}`)}
              </p>
            </div>
          ))}
        </div>

        {/* New requests */}
        <section className="space-y-3">
          <h2 className="font-heading font-bold">{t("newRequests")}</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.title}
                className="bg-card border-border flex items-center gap-3 rounded-2xl border p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-muted-foreground text-xs">{r.when}</p>
                </div>
                <button
                  type="button"
                  className="bg-brand-gradient shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  {t("accept")}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <ProviderBottomNav active="dashboard" />
    </div>
  );
}
