import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createUsersRepository } from "./repository";
import { createUsersService, type UsersService } from "./service";

/** Build a users service bound to the request's Supabase client. */
export async function getUsersService(): Promise<UsersService> {
  const supabase = await createClient();
  return createUsersService(createUsersRepository(supabase));
}

export {
  updateProfileSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
} from "./schemas";
export type { UserAccount, Profile, Me } from "./types";
export type { UsersService } from "./service";
