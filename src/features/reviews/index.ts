import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createReviewsRepository } from "./repository";
import { createReviewsService, type ReviewsService } from "./service";

/** Build a reviews service bound to the current request's Supabase client. */
export async function getReviewsService(): Promise<ReviewsService> {
  const supabase = await createClient();
  return createReviewsService(createReviewsRepository(supabase));
}

export {
  createReviewSchema,
  updateReviewSchema,
  replyReviewSchema,
  listReviewsQuerySchema,
} from "./schemas";
export type { Review } from "./types";
export type { ReviewsService } from "./service";
