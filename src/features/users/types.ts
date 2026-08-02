import type { z } from "zod";

import type { PaginationQuery } from "@/lib/api";
import type { UserRole } from "@/lib/constants";

import type {
  adminUpdateUserSchema,
  updateProfileSchema,
  USER_STATUSES,
} from "./schemas";

export type UserStatus = (typeof USER_STATUSES)[number];

/** Application user account (from `public.users`). */
export interface UserAccount {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Display profile (from `public.profiles`). */
export interface Profile {
  userId: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  locale: string;
  cityId: string | null;
  updatedAt: string;
}

/** The current user's account joined with their profile. */
export interface Me {
  account: UserAccount;
  profile: Profile | null;
}

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export interface ListUsersParams extends PaginationQuery {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}
