import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  BUSINESS_LISTING_STATUSES,
  createBusinessListingSchema,
  updateBusinessListingSchema,
} from "./schemas";

export type BusinessListingStatus = (typeof BUSINESS_LISTING_STATUSES)[number];

/** Domain entity (camelCase) exposed by the business-listings service. */
export interface BusinessListing {
  id: string;
  providerId: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  industryEn: string | null;
  industryAr: string | null;
  askingPrice: number;
  currency: string;
  monthlyRevenue: number | null;
  establishedYear: number | null;
  cityId: string | null;
  status: BusinessListingStatus;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateBusinessListingInput = z.infer<
  typeof createBusinessListingSchema
>;
export type UpdateBusinessListingInput = z.infer<
  typeof updateBusinessListingSchema
>;

export interface ListBusinessListingsParams extends PaginationQuery {
  providerId?: string;
  cityId?: string;
  status?: BusinessListingStatus;
  featuredOnly: boolean;
  search?: string;
}
