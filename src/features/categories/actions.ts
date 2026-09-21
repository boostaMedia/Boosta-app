"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import { getCategoriesService } from "./index";

const log = logger.child({ module: "categories" });

export type CategoryResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid" | "exists" | "not_found" | "has_services" | "failed";
    };

const namesSchema = z.object({
  nameEn: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
});

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/home");
}

/** Admin: add a category (appended after the existing ones). */
export async function createCategoryAction(input: {
  nameEn: string;
  nameAr: string;
}): Promise<CategoryResult> {
  await requireAdmin();
  const parsed = namesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const categories = await getCategoriesService();
    const { items } = await categories.list({
      page: 1,
      pageSize: 100,
      activeOnly: false,
    });
    const nextOrder = items.reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1;
    const base =
      slugify(parsed.data.nameEn) || `category-${Date.now().toString(36)}`;

    await categories.create({
      slug: base,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      isActive: true,
      sortOrder: nextOrder,
    });
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof ConflictError) return { ok: false, error: "exists" };
    log.warn("create_category.failed", { error });
    return { ok: false, error: "failed" };
  }
}

/** Admin: rename a category in both languages. */
export async function renameCategoryAction(
  id: string,
  input: { nameEn: string; nameAr: string },
): Promise<CategoryResult> {
  await requireAdmin();
  const parsed = namesSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(id).success) {
    return { ok: false, error: "invalid" };
  }
  try {
    await (await getCategoriesService()).update(id, parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("rename_category.failed", { error, id });
    return { ok: false, error: "failed" };
  }
}

/** Admin: show or hide a category without deleting it. */
export async function setCategoryActiveAction(
  id: string,
  isActive: boolean,
): Promise<CategoryResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  try {
    await (await getCategoriesService()).update(id, { isActive });
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("set_category_active.failed", { error, id });
    return { ok: false, error: "failed" };
  }
}

/**
 * Admin: delete a category. A category that still has services is never
 * deleted — the caller should hide it instead — so providers' listings can't
 * be orphaned.
 */
export async function deleteCategoryAction(
  id: string,
): Promise<CategoryResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) return { ok: false, error: "has_services" };

    await (await getCategoriesService()).remove(id);
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("delete_category.failed", { error, id });
    return { ok: false, error: "failed" };
  }
}
