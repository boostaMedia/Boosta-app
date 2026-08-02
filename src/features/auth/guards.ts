import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import type { UserRole } from "@/lib/constants";

import { getAppUser } from "./queries";
import type { AppUser } from "./types";

/**
 * Ensure a user is authenticated. Redirects to the localized login page when
 * not. Returns the {@link AppUser} for use in the caller.
 */
export async function requireUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }
  return user;
}

/**
 * Ensure the authenticated user holds one of the given roles. Redirects to
 * login when unauthenticated, or to the localized home page when the role is
 * insufficient.
 */
export async function requireRole(...roles: UserRole[]): Promise<AppUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    const locale = await getLocale();
    redirect(`/${locale}`);
  }
  return user;
}

/** Convenience guards for the three primary roles. */
export const requireAdmin = () => requireRole("admin");
export const requireProvider = () => requireRole("provider");
export const requireCustomer = () => requireRole("customer");
