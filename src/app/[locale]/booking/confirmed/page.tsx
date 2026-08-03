import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Confirmed />;
}

function Confirmed() {
  const t = useTranslations("confirmScreen");
  const locale = useLocale();
  const currency = locale === "ar" ? "د.ك" : "KWD";

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="bg-success/12 grid size-24 place-items-center rounded-full">
          <div className="bg-success grid size-16 place-items-center rounded-full text-white shadow-md">
            <Check className="size-9 stroke-[3]" aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground text-pretty">{t("subtitle")}</p>
        </div>

        <div className="bg-card border-border w-full space-y-3 rounded-2xl border p-5 text-start shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {t("bookingNo")}
            </span>
            <span className="font-heading font-bold">#BK-58213</span>
          </div>
          <div className="border-border flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-sm">{t("amount")}</span>
            <span className="text-primary font-bold">46.000 {currency}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/booking/confirmed"
          className="bg-brand-gradient flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white shadow-md hover:opacity-90"
        >
          {t("track")}
        </Link>
        <Link
          href="/home"
          className="text-muted-foreground hover:text-foreground flex h-11 w-full items-center justify-center text-sm font-medium"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
