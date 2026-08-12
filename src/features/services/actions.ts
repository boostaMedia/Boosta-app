"use server";

import { revalidatePath } from "next/cache";

import { requireProvider } from "@/features/auth";
import { getCurrentProviderId } from "@/features/providers";
import { ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { getServicesService } from "./index";
import { createServiceSchema } from "./schemas";

const log = logger.child({ module: "services" });

export type CreateServiceResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "no_provider" | "slug_taken" | "failed" };

/** Slugify a title: lowercase, ascii-ish, hyphen-separated. */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a service for the signed-in provider. `requireProvider()` plus the
 * "services owner write" RLS policy both enforce that only the owning
 * provider can create rows under their own provider_id — this also fails
 * cleanly if they haven't completed provider registration yet (no
 * `providers` row means `getCurrentProviderId()` returns null).
 */
export async function createServiceAction(input: {
  categoryId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  basePrice: number;
  priceType: string;
  durationMinutes?: number;
  publish: boolean;
}): Promise<CreateServiceResult> {
  await requireProvider();
  const providerId = await getCurrentProviderId();
  if (!providerId) return { ok: false, error: "no_provider" };

  const base = slugify(input.titleEn);
  if (!base) return { ok: false, error: "invalid" };

  const services = await getServicesService();

  // Try the clean slug first, then a couple of short-suffixed fallbacks on
  // conflict — a provider adding "Logo Design" twice shouldn't have to
  // think about URL slugs to resolve it.
  const candidates = [
    base,
    `${base}-${Math.random().toString(36).slice(2, 6)}`,
    `${base}-${Math.random().toString(36).slice(2, 6)}`,
  ];

  for (const [i, slug] of candidates.entries()) {
    const parsed = createServiceSchema.safeParse({
      categoryId: input.categoryId,
      slug,
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      descriptionEn: input.descriptionEn || undefined,
      descriptionAr: input.descriptionAr || undefined,
      basePrice: input.basePrice,
      priceType: input.priceType,
      durationMinutes: input.durationMinutes || undefined,
      status: input.publish ? "active" : "draft",
    });
    if (!parsed.success) return { ok: false, error: "invalid" };

    try {
      await services.create(providerId, parsed.data);
      revalidatePath("/dashboard/services");
      return { ok: true };
    } catch (error) {
      const isLastAttempt = i === candidates.length - 1;
      if (error instanceof ConflictError && !isLastAttempt) continue;
      log.warn("create_service.failed", { error });
      return {
        ok: false,
        error: error instanceof ConflictError ? "slug_taken" : "failed",
      };
    }
  }

  return { ok: false, error: "failed" };
}
