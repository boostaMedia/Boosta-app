import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createReviewSchema,
  REVIEW_STATUSES,
  updateReviewSchema,
} from "./schemas";

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Domain entity (camelCase) exposed by the reviews service. */
export interface Review {
  id: string;
  orderId: string | null;
  providerId: string;
  serviceId: string | null;
  customerId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  providerReply: string | null;
  providerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export interface ListReviewsParams extends PaginationQuery {
  providerId?: string;
  serviceId?: string;
  status?: ReviewStatus;
}
