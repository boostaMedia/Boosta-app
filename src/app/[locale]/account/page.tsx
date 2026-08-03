import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  UserPen,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Account />;
}

const MENU = [
  { key: "editProfile", Icon: UserPen },
  { key: "addresses", Icon: MapPin },
  { key: "payments", Icon: CreditCard },
  { key: "notifications", Icon: Bell },
  { key: "language", Icon: Globe },
  { key: "help", Icon: HelpCircle },
] as const;

function Account() {
  const t = useTranslations("accountScreen");
  const locale = useLocale();
  const initial = locale === "ar" ? "ر" : "R";

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-4">
          <div className="bg-brand-gradient grid size-16 place-items-center rounded-2xl text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading truncate text-lg font-extrabold">
              {t("name")}
            </h1>
            <p className="text-muted-foreground text-sm" dir="ltr">
              {t("phone")}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <ul className="bg-card border-border divide-border overflow-hidden rounded-2xl border shadow-sm">
          {MENU.map(({ key, Icon }) => (
            <li key={key} className="divide-y">
              <button
                type="button"
                className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 text-start transition-colors"
              >
                <Icon className="text-primary size-5 shrink-0" aria-hidden />
                <span className="flex-1 font-medium">{t(`menu.${key}`)}</span>
                <ChevronRight
                  className="text-muted-foreground size-5 rtl:rotate-180"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="text-destructive mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent p-4 font-semibold"
        >
          <LogOut className="size-5 rtl:rotate-180" aria-hidden />
          {t("menu.signOut")}
        </button>
      </main>

      <BottomNav active="account" />
    </div>
  );
}
