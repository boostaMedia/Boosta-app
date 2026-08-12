"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { registerProviderAction } from "../actions";
import type { RegisterProviderResult } from "../actions";

const fieldClasses =
  "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30";

const ERROR_KEYS = new Set(["invalid", "slug_taken", "failed"]);

export function RegisterProviderForm({
  cities,
}: {
  cities: { id: string; nameEn: string; nameAr: string }[];
}) {
  const t = useTranslations("providerRegisterScreen");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [businessNameEn, setBusinessNameEn] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [cityId, setCityId] = useState("");

  const canSubmit =
    businessNameEn.trim().length > 0 && businessNameAr.trim().length > 0;

  function resolveError(
    result: Extract<RegisterProviderResult, { ok: false }>,
  ) {
    return t(
      `errors.${ERROR_KEYS.has(result.error) ? result.error : "failed"}`,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await registerProviderAction({
        businessNameEn: businessNameEn.trim(),
        businessNameAr: businessNameAr.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionAr: descriptionAr.trim(),
        cityId: cityId || undefined,
      });
      if (result.ok) {
        router.refresh();
      } else {
        setError(resolveError(result));
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="font-heading text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="businessNameEn">{t("businessNameEnLabel")}</Label>
          <Input
            id="businessNameEn"
            required
            dir="ltr"
            value={businessNameEn}
            placeholder={t("businessNameEnPlaceholder")}
            onChange={(e) => setBusinessNameEn(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="businessNameAr">{t("businessNameArLabel")}</Label>
          <Input
            id="businessNameAr"
            required
            dir="rtl"
            value={businessNameAr}
            placeholder={t("businessNameArPlaceholder")}
            onChange={(e) => setBusinessNameAr(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cityId">{t("cityLabel")}</Label>
          <select
            id="cityId"
            className={fieldClasses}
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
          >
            <option value="">{t("cityPlaceholder")}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {locale === "ar" ? city.nameAr : city.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="descriptionEn">{t("descriptionEnLabel")}</Label>
          <textarea
            id="descriptionEn"
            dir="ltr"
            rows={3}
            className={fieldClasses}
            value={descriptionEn}
            placeholder={t("descriptionEnPlaceholder")}
            onChange={(e) => setDescriptionEn(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="descriptionAr">{t("descriptionArLabel")}</Label>
          <textarea
            id="descriptionAr"
            dir="rtl"
            rows={3}
            className={fieldClasses}
            value={descriptionAr}
            placeholder={t("descriptionArPlaceholder")}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          {t("pendingNote")}
        </p>
      </form>
    </div>
  );
}
