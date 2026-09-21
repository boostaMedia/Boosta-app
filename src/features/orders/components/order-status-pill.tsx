import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { OrderStatus } from "../types";

const CLASSES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-success/12 text-success",
  in_progress: "bg-accent text-primary",
  completed: "bg-success/12 text-success",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
  disputed: "bg-destructive/10 text-destructive",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const t = useTranslations("bookingsScreen.status");
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        CLASSES[status],
      )}
    >
      {t(status)}
    </span>
  );
}
