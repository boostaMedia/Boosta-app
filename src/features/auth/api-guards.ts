import "server-only";

import type { UserRole } from "@/lib/constants";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

import { getAppUser } from "./queries";
import type { AppUser } from "./types";

/**
 * Authorization guards for API route handlers. Unlike the page guards in
 * `guards.ts` (which redirect), these THROW `AppError`s so the `route()`
 * wrapper maps them to 401/403 JSON responses.
 */

export async function requireApiUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireApiRole(...roles: UserRole[]): Promise<AppUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
