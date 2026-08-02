import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { rangeFor } from "@/lib/api";

import type { profileRowSchema, userRowSchema } from "./schemas";
import type {
  AdminUpdateUserInput,
  ListUsersParams,
  Profile,
  UpdateProfileInput,
  UserAccount,
} from "./types";

type UserRow = z.infer<typeof userRowSchema>;
type ProfileRow = z.infer<typeof profileRowSchema>;

function toAccount(row: UserRow): UserAccount {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    locale: row.locale,
    cityId: row.city_id,
    updatedAt: row.updated_at,
  };
}

function profileToRow(input: UpdateProfileInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.fullName !== undefined) row.full_name = input.fullName;
  if (input.displayName !== undefined) row.display_name = input.displayName;
  if (input.avatarUrl !== undefined) row.avatar_url = input.avatarUrl;
  if (input.bio !== undefined) row.bio = input.bio;
  if (input.gender !== undefined) row.gender = input.gender;
  if (input.dateOfBirth !== undefined) row.date_of_birth = input.dateOfBirth;
  if (input.locale !== undefined) row.locale = input.locale;
  if (input.cityId !== undefined) row.city_id = input.cityId;
  return row;
}

export interface UsersRepository {
  findAccount(id: string): Promise<UserAccount | null>;
  findProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile>;
  listAccounts(
    params: ListUsersParams,
  ): Promise<{ items: UserAccount[]; total: number }>;
  adminUpdate(
    id: string,
    input: AdminUpdateUserInput,
  ): Promise<UserAccount | null>;
}

export function createUsersRepository(
  supabase: SupabaseClient,
): UsersRepository {
  return {
    async findAccount(id) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toAccount(data as UserRow) : null;
    },

    async findProfile(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toProfile(data as ProfileRow) : null;
    },

    async updateProfile(userId, input) {
      const { data, error } = await supabase
        .from("profiles")
        .update(profileToRow(input))
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return toProfile(data as ProfileRow);
    },

    async listAccounts(params) {
      const { from, to } = rangeFor(params);
      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (params.role) query = query.eq("role", params.role);
      if (params.status) query = query.eq("status", params.status);
      if (params.search) {
        const term = params.search.replace(/[%,()*\\]/g, "");
        query = query.or(`email.ilike.%${term}%,phone.ilike.%${term}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return {
        items: ((data ?? []) as UserRow[]).map(toAccount),
        total: count ?? 0,
      };
    },

    async adminUpdate(id, input) {
      const row: Record<string, unknown> = {};
      if (input.role !== undefined) row.role = input.role;
      if (input.status !== undefined) row.status = input.status;
      if (input.isVerified !== undefined) row.is_verified = input.isVerified;

      const { data, error } = await supabase
        .from("users")
        .update(row)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toAccount(data as UserRow) : null;
    },
  };
}
