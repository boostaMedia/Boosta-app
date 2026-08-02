import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createOfferSchema,
  DISCOUNT_TYPES,
  OFFER_STATUSES,
  updateOfferSchema,
} from "./schemas";

export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** Domain entity (camelCase) exposed by the offers service. */
export interface Offer {
  id: string;
  providerId: string;
  serviceId: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number | null;
  finalPrice: number | null;
  currency: string;
  startsAt: string;
  endsAt: string | null;
  status: OfferStatus;
  maxRedemptions: number | null;
  redemptionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

export interface ListOffersParams extends PaginationQuery {
  providerId?: string;
  serviceId?: string;
  status?: OfferStatus;
}
