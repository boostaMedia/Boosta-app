"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { createServiceAction } from "../actions";
import type { CreateServiceResult } from "../actions";
import { PRICE_TYPES } from "../schemas";

const fieldClasses =
  "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30";

const ERROR_KEYS = new Set(["invalid", "no_provider", "slug_taken", "failed"]);

export function CreateServiceForm({
  categories,
}: {
  categories: { id: string; nameEn: string; nameAr: string }[];
}) {
  const t = useTranslations("addServiceScreen");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [priceType, setPriceType] =
    useState<(typeof PRICE_TYPES)[number]>("fixed");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [publish, setPublish] = useState(true);

  const canSubmit =
    categoryId.length > 0 &&
    titleEn.trim().length > 0 &&
    titleAr.trim().length > 0 &&
    basePrice.trim().length > 0 &&
    !Number.isNaN(Number(basePrice));

  function resolveError(result: Extract<CreateServiceResult, { ok: false }>) {
    return t(
      `errors.${ERROR_KEYS.has(result.error) ? result.error : "failed"}`,
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await createServiceAction({
        categoryId,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionAr: descriptionAr.trim(),
        basePrice: Number(basePrice),
        priceType,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        publish,
      });
      if (result.ok) {
        router.push("/dashboard/services");
        router.refresh();
      } else {
        setError(resolveError(result));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">{t("categoryLabel")}</Label>
        <select
          id="categoryId"
          required
          className={fieldClasses}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">{t("categoryPlaceholder")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {locale === "ar" ? c.nameAr : c.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="titleEn">{t("titleEnLabel")}</Label>
        <Input
          id="titleEn"
          required
          dir="ltr"
          value={titleEn}
          placeholder={t("titleEnPlaceholder")}
          onChange={(e) => setTitleEn(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="titleAr">{t("titleArLabel")}</Label>
        <Input
          id="titleAr"
          required
          dir="rtl"
          value={titleAr}
          placeholder={t("titleArPlaceholder")}
          onChange={(e) => setTitleAr(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="basePrice">{t("priceLabel")}</Label>
          <Input
            id="basePrice"
            required
            type="number"
            min="0"
            step="0.001"
            dir="ltr"
            value={basePrice}
            placeholder="0.000"
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="priceType">{t("priceTypeLabel")}</Label>
          <select
            id="priceType"
            className={fieldClasses}
            value={priceType}
            onChange={(e) =>
              setPriceType(e.target.value as (typeof PRICE_TYPES)[number])
            }
          >
            {PRICE_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {t(`priceTypes.${pt}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="durationMinutes">{t("durationLabel")}</Label>
        <Input
          id="durationMinutes"
          type="number"
          min="1"
          step="1"
          dir="ltr"
          value={durationMinutes}
          placeholder={t("durationPlaceholder")}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="accent-primary size-4"
        />
        {t("publishNow")}
      </label>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!canSubmit || isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
