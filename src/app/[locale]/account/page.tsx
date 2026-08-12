import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  MessageCircle,
  UserPen,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { requireUser, signOut } from "@/features/auth";
import { getUsersService } from "@/features/users";
import type { Me } from "@/features/users";
import { Link } from "@/i18n/navigation";

const MENU = [
  { key: "editProfile", Icon: UserPen, href: null },
  { key: "messages", Icon: MessageCircle, href: "/messages" },
  { key: "addresses", Icon: MapPin, href: null },
  { key: "payments", Icon: CreditCard, href: null },
  { key: "notifications", Icon: Bell, href: null },
  { key: "language", Icon: Globe, href: null },
  { key: "help", Icon: HelpCircle, href: null },
] as const;

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();

  const users = await getUsersService();
  const me = await users.getMe(user.id);

  async function signOutAction() {
    "use server";
    await signOut();
    redirect(`/${locale}`);
  }

  return <Account me={me} signOutAction={signOutAction} />;
}

function Account({
  me,
  signOutAction,
}: {
  me: Me;
  signOutAction: () => Promise<void>;
}) {
  const t = useTranslations("accountScreen");
  const locale = useLocale();

  const displayName =
    me.profile?.fullName?.trim() || me.account.email || me.account.phone || "";
  const initial =
    displayName.length > 0
      ? displayName[0].toUpperCase()
      : locale === "ar"
        ? "ب"
        : "B";
  const contact = me.account.email ?? me.account.phone ?? "";

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-4">
          <div className="bg-brand-gradient grid size-16 place-items-center rounded-2xl text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading truncate text-lg font-extrabold">
              {displayName || t("unnamed")}
            </h1>
            {contact && (
              <p className="text-muted-foreground truncate text-sm" dir="ltr">
                {contact}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <ul className="bg-card border-border divide-border overflow-hidden rounded-2xl border shadow-sm">
          {MENU.map(({ key, Icon, href }) => (
            <li key={key} className="divide-y">
              {href ? (
                <Link
                  href={href}
                  className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 text-start transition-colors"
                >
                  <Icon className="text-primary size-5 shrink-0" aria-hidden />
                  <span className="flex-1 font-medium">{t(`menu.${key}`)}</span>
                  <ChevronRight
                    className="text-muted-foreground size-5 rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              ) : (
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
              )}
            </li>
          ))}
        </ul>

        <form action={signOutAction}>
          <button
            type="submit"
            className="text-destructive mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent p-4 font-semibold"
          >
            <LogOut className="size-5 rtl:rotate-180" aria-hidden />
            {t("menu.signOut")}
          </button>
        </form>
      </main>

      <BottomNav active="account" />
    </div>
  );
}
