"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { replyToReviewAction } from "../actions";

/** A provider's reply box under one review. */
export function ReplyForm({
  reviewId,
  initial,
}: {
  reviewId: string;
  initial: string | null;
}) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        {initial ? t("editReply") : t("reply")}
      </Button>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await replyToReviewAction({ reviewId, reply });
          if (result.ok) {
            setOpen(false);
            router.refresh();
          } else {
            setError(t("errors.failed"));
          }
        });
      }}
    >
      <textarea
        rows={3}
        required
        maxLength={2000}
        value={reply}
        placeholder={t("replyPlaceholder")}
        onChange={(e) => setReply(e.target.value)}
        className="border-input bg-card w-full rounded-xl border px-3 py-2 text-sm outline-none"
      />
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("sendReply")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
