"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { setMyCountryAction } from "../actions";

export function CountrySelect({
  countries,
  value,
}: {
  countries: {
    id: string;
    nameEn: string;
    nameAr: string;
    currencyCode: string;
  }[];
  value: string | null;
}) {
  const t = useTranslations("accountScreen.country");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value ?? "");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function handleChange(next: string) {
    if (!next) return;
    const previous = current;
    setCurrent(next);
    setStatus("idle");
    startTransition(async () => {
      const result = await setMyCountryAction(next);
      if (result.ok) {
        setStatus("saved");
      } else {
        setCurrent(previous);
        setStatus("error");
      }
    });
  }

  return (
    <div className="bg-card border-border mb-4 space-y-2 rounded-2xl border p-4 shadow-sm">
      <label htmlFor="country" className="text-sm font-semibold">
        {t("title")}
      </label>
      <select
        id="country"
        value={current}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="border-input w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm"
      >
        <option value="">{t("placeholder")}</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {locale === "ar" ? c.nameAr : c.nameEn} ({c.currencyCode})
          </option>
        ))}
      </select>
      <p className="text-muted-foreground text-xs" role="status">
        {status === "saved"
          ? t("saved")
          : status === "error"
            ? t("error")
            : t("hint")}
      </p>
    </div>
  );
}
