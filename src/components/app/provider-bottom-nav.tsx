import {
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  User,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { key: "orders", Icon: ClipboardList, href: "/dashboard/bookings" },
  { key: "wallet", Icon: Wallet, href: null },
  { key: "messages", Icon: MessageCircle, href: null },
  { key: "account", Icon: User, href: null },
] as const;

const itemClasses = (isActive: boolean) =>
  cn(
    "flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );

/** Bottom tab bar for the provider dashboard. */
export function ProviderBottomNav({
  active = "dashboard",
}: {
  active?: (typeof ITEMS)[number]["key"];
}) {
  const t = useTranslations("dashboardScreen.nav");

  return (
    <nav className="bg-card/95 border-border supports-[backdrop-filter]:bg-card/80 sticky bottom-0 z-20 border-t backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ key, Icon, href }) => {
          const isActive = key === active;
          return (
            <li key={key} className="flex-1">
              {href ? (
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={itemClasses(isActive)}
                >
                  <Icon
                    className={cn("size-5", isActive && "stroke-[2.5]")}
                    aria-hidden
                  />
                  {t(key)}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  className={itemClasses(isActive)}
                >
                  <Icon
                    className={cn("size-5", isActive && "stroke-[2.5]")}
                    aria-hidden
                  />
                  {t(key)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
