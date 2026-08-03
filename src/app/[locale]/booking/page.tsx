import { CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { Link } from "@/i18n/navigation";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Booking />;
}

function Booking() {
  const t = useTranslations("bookingScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";
  const slots =
    locale === "ar"
      ? ["10:00 ص", "1:00 م", "4:30 م"]
      : ["10:00 AM", "1:00 PM", "4:30 PM"];

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <ScreenHeader title={t("title")} backHref="/provider" />

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Date & time */}
        <section className="space-y-3">
          <h2 className="font-heading flex items-center gap-2 font-bold">
            <CalendarDays className="text-primary size-5" aria-hidden />
            {t("dateTime")}
          </h2>
          <div className="flex gap-2">
            <span className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm font-semibold">
              {t("today")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={slot}
                type="button"
                className={
                  i === 0
                    ? "border-primary bg-accent text-primary rounded-xl border-2 py-2.5 text-sm font-semibold"
                    : "border-border bg-card text-foreground rounded-xl border py-2.5 text-sm font-medium"
                }
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        {/* Address */}
        <section className="space-y-3">
          <h2 className="font-heading flex items-center gap-2 font-bold">
            <MapPin className="text-primary size-5" aria-hidden />
            {t("address")}
          </h2>
          <div className="bg-card border-border flex items-center gap-3 rounded-2xl border p-4 shadow-sm">
            <p className="flex-1 text-sm font-medium">{t("addressValue")}</p>
            <button
              type="button"
              className="text-primary text-sm font-semibold"
            >
              {t("change")}
            </button>
          </div>
        </section>

        {/* Invoice */}
        <section className="space-y-3">
          <h2 className="font-heading font-bold">{t("invoice")}</h2>
          <div className="bg-card border-border space-y-2.5 rounded-2xl border p-4 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("servicePrice")}</span>
              <span className="font-medium">45.000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("platformFee")}</span>
              <span className="font-medium">1.000</span>
            </div>
            <div className="border-border flex justify-between border-t pt-2.5 font-bold">
              <span>{t("total")}</span>
              <span className="text-primary">
                46.000 <span className="text-xs font-normal">{currency}</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky confirm bar */}
      <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t px-4 py-3 backdrop-blur">
        <Link
          href="/booking/confirmed"
          className="bg-brand-gradient flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white shadow-md hover:opacity-90"
        >
          {t("confirmPay")}
        </Link>
      </div>
    </div>
  );
}
