"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  setCategoryActiveAction,
} from "../actions";
import type { CategoryResult } from "../actions";

export interface ManagedCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  servicesCount: number;
}

export function CategoryManager({
  categories,
}: {
  categories: ManagedCategory[];
}) {
  const t = useTranslations("adminCategories");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEn, setDraftEn] = useState("");
  const [draftAr, setDraftAr] = useState("");
  const [adding, setAdding] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newAr, setNewAr] = useState("");

  function run(action: () => Promise<CategoryResult>, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onOk?.();
        router.refresh();
      } else {
        setMessage(t(`errors.${result.error}`));
      }
    });
  }

  function startEdit(c: ManagedCategory) {
    setEditingId(c.id);
    setDraftEn(c.nameEn);
    setDraftAr(c.nameAr);
    setMessage(null);
  }

  function handleDelete(c: ManagedCategory) {
    if (!window.confirm(t("confirmDelete", { name: c.nameEn }))) return;
    run(() => deleteCategoryAction(c.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{t("hint")}</p>
        <Button
          type="button"
          size="sm"
          onClick={() => setAdding((v) => !v)}
          disabled={isPending}
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      </div>

      {adding && (
        <form
          className="bg-accent grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createCategoryAction({ nameEn: newEn, nameAr: newAr }),
              () => {
                setAdding(false);
                setNewEn("");
                setNewAr("");
              },
            );
          }}
        >
          <Input
            dir="ltr"
            required
            value={newEn}
            placeholder={t("nameEn")}
            onChange={(e) => setNewEn(e.target.value)}
          />
          <Input
            dir="rtl"
            required
            value={newAr}
            placeholder={t("nameAr")}
            onChange={(e) => setNewAr(e.target.value)}
          />
          <Button type="submit" disabled={isPending}>
            {t("save")}
          </Button>
        </form>
      )}

      {message && (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      )}

      <div className="bg-card border-border divide-border divide-y overflow-hidden rounded-2xl border shadow-sm">
        {categories.length === 0 && (
          <p className="text-muted-foreground p-6 text-center text-sm">
            {t("empty")}
          </p>
        )}
        {categories.map((c) =>
          editingId === c.id ? (
            <form
              key={c.id}
              className="bg-accent grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    renameCategoryAction(c.id, {
                      nameEn: draftEn,
                      nameAr: draftAr,
                    }),
                  () => setEditingId(null),
                );
              }}
            >
              <Input
                dir="ltr"
                required
                value={draftEn}
                onChange={(e) => setDraftEn(e.target.value)}
              />
              <Input
                dir="rtl"
                required
                value={draftAr}
                onChange={(e) => setDraftAr(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  {t("save")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.nameAr}</p>
                <p className="text-muted-foreground truncate text-xs" dir="ltr">
                  {c.nameEn}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {t("servicesCount", { count: c.servicesCount })}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  c.isActive
                    ? "bg-success/12 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {c.isActive ? t("visible") : t("hidden")}
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={t("edit")}
                  disabled={isPending}
                  onClick={() => startEdit(c)}
                  className="hover:bg-muted grid size-8 place-items-center rounded-lg"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={c.isActive ? t("hide") : t("show")}
                  disabled={isPending}
                  onClick={() =>
                    run(() => setCategoryActiveAction(c.id, !c.isActive))
                  }
                  className="hover:bg-muted grid size-8 place-items-center rounded-lg"
                >
                  {c.isActive ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t("delete")}
                  disabled={isPending}
                  onClick={() => handleDelete(c)}
                  className="text-destructive hover:bg-destructive/10 grid size-8 place-items-center rounded-lg"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
