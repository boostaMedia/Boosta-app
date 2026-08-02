import { z } from "zod";

import { paginationQuerySchema } from "@/lib/api";
import { USER_ROLES } from "@/lib/constants";

export const USER_STATUSES = [
  "active",
  "suspended",
  "pending",
  "banned",
] as const;

/** Shape of a `public.users` row from Supabase (snake_case). */
export const userRowSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  is_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Shape of a `public.profiles` row from Supabase (snake_case). */
export const profileRowSchema = z.object({
  user_id: z.string(),
  full_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  gender: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  locale: z.string(),
  city_id: z.string().nullable(),
  updated_at: z.string(),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().max(160),
    displayName: z.string().max(80),
    avatarUrl: z.url(),
    bio: z.string().max(1000),
    gender: z.enum(["male", "female", "unspecified"]),
    dateOfBirth: z.iso.date(),
    locale: z.enum(["ar", "en"]),
    cityId: z.uuid(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(USER_ROLES),
    status: z.enum(USER_STATUSES),
    isVerified: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});
