import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { cn } from "@/lib/utils";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Bookings />;
}

const TABS = ["upcoming", "completed", "cancelled"] as const;

const ITEMS = [
  {
    initials: "PX",
    service: "s1",
    provider: "s1Provider",
    when: "today",
    time: "10:00",
    status: "confirmed" as const,
  },
  {
    initials: "LH",
    service: "s2",
    provider: "s2Provider",
    when: "tomorrow",
    time: "16:00",
    status: "awaiting" as const,
  },
];

function Bookings() {
  const t = useTranslations("bookingsScreen");
  const tSvc = useTranslations("customerHome.svc");
  const locale = useLocale();
  const initials = (en: string) =>
    locale === "ar" ? (en === "PX" ? "بك" : "لن") : en;

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-4 pb-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
          <button
            type="button"
            aria-label="Notifications"
            className="border-border bg-card grid size-10 place-items-center rounded-full border"
          >
            <Bell className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold",
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground border font-medium",
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4">
        {ITEMS.map((item) => (
          <article
            key={item.service}
            className="bg-card border-border rounded-2xl border p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                {t(item.when)} {item.time}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  item.status === "confirmed"
                    ? "bg-success/12 text-success"
                    : "bg-warning/15 text-warning",
                )}
              >
                {t(item.status)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">
                {initials(item.initials)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold">{tSvc(item.service)}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {tSvc(item.provider)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </main>

      <BottomNav active="bookings" />
    </div>
  );
}
