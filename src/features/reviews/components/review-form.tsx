"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { createReviewAction } from "../actions";

const ERROR_KEYS = new Set([
  "invalid",
  "not_allowed",
  "already_reviewed",
  "not_found",
  "failed",
]);

/** Star picker + optional comment for a completed booking. */
export function ReviewForm({ orderId }: { orderId: string }) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) {
      setError(t("errors.pickRating"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createReviewAction({ orderId, rating, comment });
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
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <p className="text-sm font-medium">{t("rateThis")}</p>
      <div className="flex gap-1" role="radiogroup" aria-label={t("rateThis")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} / 5`}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
          >
            <Star
              aria-hidden
              className={cn(
                "size-7",
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        maxLength={2000}
        value={comment}
        placeholder={t("commentPlaceholder")}
        onChange={(e) => setComment(e.target.value)}
        className="border-input bg-card w-full rounded-xl border px-3 py-2 text-sm outline-none"
      />
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
