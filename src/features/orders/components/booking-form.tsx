"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { createBookingAction } from "../actions";

const fieldClasses =
  "border-input bg-card placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-3";

const ERROR_KEYS = new Set(["invalid_time", "unavailable", "failed"]);

export function BookingForm({
  serviceId,
  children,
}: {
  serviceId: string;
  /** The read-only summary (price, provider) rendered by the server page. */
  children: React.ReactNode;
}) {
  const t = useTranslations("bookingScreen");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await createBookingAction({
        serviceId,
        // datetime-local is the customer's local time; convert to an instant.
        scheduledAt: when ? new Date(when).toISOString() : undefined,
        notes,
      });
      if (result.ok) {
        router.push(`/booking/confirmed?order=${result.orderId}`);
      } else {
        setError(
          t(`errors.${ERROR_KEYS.has(result.error) ? result.error : "failed"}`),
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <main className="flex-1 space-y-6 px-4 py-4">
        {children}

        <section className="space-y-3">
          <label htmlFor="when" className="font-heading block font-bold">
            {t("dateTime")}
          </label>
          <input
            id="when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={fieldClasses}
          />
          <p className="text-muted-foreground text-xs">{t("dateTimeHint")}</p>
        </section>

        <section className="space-y-3">
          <label htmlFor="notes" className="font-heading block font-bold">
            {t("notes")}
          </label>
          <textarea
            id="notes"
            rows={4}
            maxLength={2000}
            value={notes}
            placeholder={t("notesPlaceholder")}
            onChange={(e) => setNotes(e.target.value)}
            className={fieldClasses}
          />
        </section>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </main>

      <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 space-y-2 border-t px-4 py-3 backdrop-blur">
        <p className="text-muted-foreground text-center text-xs">
          {t("paymentNote")}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-gradient flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? t("submitting") : t("confirmPay")}
        </button>
      </div>
    </form>
  );
}
