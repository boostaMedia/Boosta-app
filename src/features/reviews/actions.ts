"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCustomer, requireProvider } from "@/features/auth";
import { getOrdersService } from "@/features/orders";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { getReviewsService } from "./index";

const log = logger.child({ module: "reviews" });

export type ReviewResult =
  | { ok: true }
  | {
      ok: false;
      error:
        "invalid" | "not_allowed" | "already_reviewed" | "not_found" | "failed";
    };

const reviewSchema = z.object({
  orderId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000),
});

/**
 * Review a completed booking. The provider and service come from the order on
 * the server, and the database re-checks that the order is the caller's own
 * and completed — so a review can only exist for work that was actually done.
 */
export async function createReviewAction(input: {
  orderId: string;
  rating: number;
  comment: string;
}): Promise<ReviewResult> {
  const user = await requireCustomer();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const order = await (await getOrdersService()).get(parsed.data.orderId);
    if (order.customerId !== user.id || order.status !== "completed") {
      return { ok: false, error: "not_allowed" };
    }

    await (
      await getReviewsService()
    ).create(user.id, {
      providerId: order.providerId,
      serviceId: order.serviceId ?? undefined,
      orderId: order.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || undefined,
    });

    revalidatePath("/bookings");
    revalidatePath("/provider/[slug]", "page");
    return { ok: true };
  } catch (error) {
    if (error instanceof ConflictError) {
      return { ok: false, error: "already_reviewed" };
    }
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("create_review.failed", { error });
    return { ok: false, error: "failed" };
  }
}

const replySchema = z.object({
  reviewId: z.uuid(),
  reply: z.string().trim().min(1).max(2000),
});

/** A provider answers a review of their own work (one reply, editable). */
export async function replyToReviewAction(input: {
  reviewId: string;
  reply: string;
}): Promise<ReviewResult> {
  await requireProvider();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    await (
      await getReviewsService()
    ).reply(parsed.data.reviewId, parsed.data.reply);
    revalidatePath("/dashboard/reviews");
    revalidatePath("/provider/[slug]", "page");
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError)
      return { ok: false, error: "not_found" };
    log.warn("reply_review.failed", { error });
    return { ok: false, error: "failed" };
  }
}
