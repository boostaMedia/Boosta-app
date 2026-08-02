import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";

import type {
  createServiceSchema,
  PRICE_TYPES,
  SERVICE_STATUSES,
  updateServiceSchema,
} from "./schemas";

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
export type PriceType = (typeof PRICE_TYPES)[number];

/** Domain entity (camelCase) exposed by the services service. */
export interface Service {
  id: string;
  providerId: string;
  categoryId: string;
  subCategoryId: string | null;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  basePrice: number;
  currency: string;
  priceType: PriceType;
  durationMinutes: number | null;
  status: ServiceStatus;
  isFeatured: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export interface ListServicesParams extends PaginationQuery {
  categoryId?: string;
  subCategoryId?: string;
  providerId?: string;
  status?: ServiceStatus;
  search?: string;
}
