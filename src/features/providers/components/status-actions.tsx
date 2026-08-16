"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { setProviderStatusAction } from "../actions";
import type { ProviderStatus } from "../types";

type NextAction = {
  status: ProviderStatus;
  labelKey: string;
  variant?: "default" | "outline" | "destructive";
};

const NEXT_ACTIONS: Record<ProviderStatus, NextAction[]> = {
  pending: [
    { status: "verified", labelKey: "approve" },
    { status: "rejected", labelKey: "reject", variant: "destructive" },
  ],
  verified: [
    { status: "suspended", labelKey: "suspend", variant: "destructive" },
  ],
  rejected: [{ status: "pending", labelKey: "reconsider" }],
  suspended: [{ status: "verified", labelKey: "reinstate" }],
};

export function ProviderStatusActions({
  providerId,
  status,
}: {
  providerId: string;
  status: ProviderStatus;
}) {
  const t = useTranslations("adminProviderDetailScreen");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<ProviderStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[status];

  function handleClick(target: ProviderStatus) {
    setError(null);
    setPendingTarget(target);
    startTransition(async () => {
      const result = await setProviderStatusAction(providerId, target);
      if (result.ok) {
        router.refresh();
      } else {
        setError(
          t(`errors.${result.error === "not_found" ? "not_found" : "failed"}`),
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map(({ status: target, labelKey, variant }) => (
          <Button
            key={target}
            type="button"
            variant={variant ?? "default"}
            disabled={isPending}
            onClick={() => handleClick(target)}
          >
            {isPending && pendingTarget === target
              ? t("updating")
              : t(labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
