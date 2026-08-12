import { Ban, Clock, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { ProviderStatus } from "../types";

const ICONS = {
  pending: Clock,
  rejected: ShieldAlert,
  suspended: Ban,
} as const;

/** Shown in place of the dashboard for any provider status other than 'verified'. */
export function PendingApprovalScreen({
  status,
  businessNameEn,
  businessNameAr,
}: {
  status: Exclude<ProviderStatus, "verified">;
  businessNameEn: string;
  businessNameAr: string;
}) {
  const t = useTranslations("providerPendingScreen");
  const locale = useLocale();
  const businessName = locale === "ar" ? businessNameAr : businessNameEn;
  const Icon = ICONS[status];

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <span className="bg-brand-gradient mb-5 grid size-16 place-items-center rounded-2xl text-white shadow-md">
        <Icon className="size-8" aria-hidden />
      </span>
      <h1 className="font-heading text-xl font-extrabold">
        {t(`${status}.title`)}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">
        {t(`${status}.subtitle`, { businessName })}
      </p>
    </div>
  );
}
