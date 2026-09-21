"use client";

import { LayoutDashboard, ReceiptText, Tags, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "dashboard", href: "/admin", Icon: LayoutDashboard },
  { key: "providers", href: "/admin/providers", Icon: UserCheck },
  { key: "categories", href: "/admin/categories", Icon: Tags },
  { key: "finance", href: "/admin/finance", Icon: ReceiptText },
] as const;

/** Tab bar for the admin console; each tab is its own page. */
export function AdminNav() {
  const t = useTranslations("adminNav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="bg-muted/60 mb-6 flex gap-1 overflow-x-auto rounded-2xl p-1"
    >
      {ITEMS.map(({ key, href, Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
