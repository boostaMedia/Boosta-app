"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import { recordPaymentAction, voidInvoiceAction } from "../actions";

const METHODS = ["bank_transfer", "cash", "card", "other"] as const;

/** Record a manual payment against an open invoice, or cancel it. */
export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const t = useTranslations("adminFinance");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [method, setMethod] =
    useState<(typeof METHODS)[number]>("bank_transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(t("actionFailed"));
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {t("recordPayment")}
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          recordPaymentAction({
            invoiceId,
            method: t(`methods.${method}`),
            reference,
          }),
        );
      }}
    >
      <select
        aria-label={t("method")}
        value={method}
        onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
        className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
      >
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {t(`methods.${m}`)}
          </option>
        ))}
      </select>
      <Input
        dir="ltr"
        className="h-8 w-32"
        placeholder={t("reference")}
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {t("confirmPayment")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => setOpen(false)}
      >
        {t("cancel")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          if (window.confirm(t("confirmVoid")))
            run(() => voidInvoiceAction(invoiceId));
        }}
      >
        {t("void")}
      </Button>
      {error && (
        <span role="alert" className="text-destructive w-full text-xs">
          {error}
        </span>
      )}
    </form>
  );
}
