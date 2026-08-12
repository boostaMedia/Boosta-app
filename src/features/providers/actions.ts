"use server";

import { requireProvider } from "@/features/auth";
import { ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { PROVIDER_CONTRACT_VERSION } from "./contract";
import { getProvidersService } from "./index";
import { createProviderSchema } from "./schemas";

const log = logger.child({ module: "providers" });

export type RegisterProviderResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid" | "contract_required" | "slug_taken" | "failed";
    };

/** Slugify a business name: lowercase, ascii-ish, hyphen-separated. */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Register the signed-in provider's business profile — really a *request* to
 * join: the row is created with status='pending' (the table default) and
 * only an admin flipping it to 'verified' grants real access. Only
 * meaningful for a user with role='provider' who doesn't have a `providers`
 * row yet — `requireProvider()` plus the "providers insert own" RLS policy
 * both enforce that only they can create it, and only once.
 *
 * Requires contract acceptance: `contractAcceptedAt` is stamped here from
 * the server clock, never trusted from the client — the client only
 * confirms the checkbox and provides the signed name.
 */
export async function registerProviderAction(input: {
  businessNameEn: string;
  businessNameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  cityId?: string;
  contractAgreed: boolean;
  contractSignedName: string;
}): Promise<RegisterProviderResult> {
  const user = await requireProvider();

  if (!input.contractAgreed || input.contractSignedName.trim().length === 0) {
    return { ok: false, error: "contract_required" };
  }

  const base = slugify(input.businessNameEn);
  if (!base) return { ok: false, error: "invalid" };

  const services = await getProvidersService();

  // Try the clean slug first, then a couple of short-suffixed fallbacks on
  // conflict rather than surfacing "pick a different slug" to a business
  // owner who never typed one in the first place.
  const candidates = [
    base,
    `${base}-${Math.random().toString(36).slice(2, 6)}`,
    `${base}-${Math.random().toString(36).slice(2, 6)}`,
  ];

  for (const [i, slug] of candidates.entries()) {
    const parsed = createProviderSchema.safeParse({
      slug,
      businessNameEn: input.businessNameEn,
      businessNameAr: input.businessNameAr,
      descriptionEn: input.descriptionEn || undefined,
      descriptionAr: input.descriptionAr || undefined,
      cityId: input.cityId || undefined,
      contractAcceptedAt: new Date().toISOString(),
      contractVersion: PROVIDER_CONTRACT_VERSION,
      contractSignedName: input.contractSignedName.trim(),
    });
    if (!parsed.success) return { ok: false, error: "invalid" };

    try {
      await services.create(user.id, parsed.data);
      return { ok: true };
    } catch (error) {
      const isLastAttempt = i === candidates.length - 1;
      if (error instanceof ConflictError && !isLastAttempt) continue;
      log.warn("register_provider.failed", { error });
      return {
        ok: false,
        error: error instanceof ConflictError ? "slug_taken" : "failed",
      };
    }
  }

  return { ok: false, error: "failed" };
}
