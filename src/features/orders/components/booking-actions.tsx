"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { updateBookingStatusAction } from "../actions";
import type { OrderStatus } from "../types";

const ERROR_KEYS = new Set(["not_allowed", "not_found", "failed"]);

/** Status-change buttons for one booking; `options` comes from the server. */
export function BookingActions({
  orderId,
  options,
}: {
  orderId: string;
  options: OrderStatus[];
}) {
  const t = useTranslations("bookingActions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) return null;

  function handleClick(status: OrderStatus) {
    setError(null);
    setTarget(status);
    startTransition(async () => {
      const result = await updateBookingStatusAction(orderId, status);
      if (result.ok) {
        router.refresh();
      } else {
        setError(
          t(`errors.${ERROR_KEYS.has(result.error) ? result.error : "failed"}`),
        );
      }
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={status === "cancelled" ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => handleClick(status)}
          >
            {isPending && target === status ? t("updating") : t(status)}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
