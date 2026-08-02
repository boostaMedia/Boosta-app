import {
  CalendarCheck,
  Home,
  LayoutGrid,
  MessageCircle,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "home", Icon: Home },
  { key: "categories", Icon: LayoutGrid },
  { key: "bookings", Icon: CalendarCheck },
  { key: "messages", Icon: MessageCircle },
  { key: "account", Icon: User },
] as const;

/** Mobile bottom tab bar for the customer app. */
export function BottomNav({
  active = "home",
}: {
  active?: (typeof ITEMS)[number]["key"];
}) {
  const t = useTranslations("customerHome.nav");

  return (
    <nav className="bg-card/95 border-border supports-[backdrop-filter]:bg-card/80 sticky bottom-0 z-20 border-t backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ key, Icon }) => {
          const isActive = key === active;
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", isActive && "stroke-[2.5]")}
                  aria-hidden
                />
                {t(key)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
