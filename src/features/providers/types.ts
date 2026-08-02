import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  adminUpdateProviderSchema,
  createProviderSchema,
  PROVIDER_STATUSES,
  updateProviderSchema,
} from "./schemas";

export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

/** Domain entity (camelCase) exposed by the providers service. */
export interface Provider {
  id: string;
  userId: string;
  slug: string;
  businessNameEn: string;
  businessNameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: ProviderStatus;
  isFeatured: boolean;
  rating: number;
  reviewsCount: number;
  cityId: string | null;
  areaId: string | null;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type AdminUpdateProviderInput = z.infer<
  typeof adminUpdateProviderSchema
>;

/** Everything the repository can patch (owner + admin fields combined). */
export type ProviderPatch = UpdateProviderInput & AdminUpdateProviderInput;

export interface ListProvidersParams extends PaginationQuery {
  search?: string;
  cityId?: string;
  featured: boolean;
  status?: ProviderStatus;
}
