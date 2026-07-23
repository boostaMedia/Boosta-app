/**
 * Application-wide constants. Prefer importing named values from here over
 * scattering magic strings/numbers across the codebase.
 */

export const APP_NAME = "Boosta" as const;

/** Default primary market. */
export const DEFAULT_COUNTRY = "KW" as const;
export const DEFAULT_CURRENCY = "KWD" as const;
export const DEFAULT_TIMEZONE = "Asia/Kuwait" as const;

/** Pagination defaults used by list endpoints. */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

/** Top-level application routes. Locale prefixing is handled by navigation. */
export const ROUTES = {
  home: "/",
} as const;

/** Roles used for role-based access control (RBAC). */
export const USER_ROLES = ["admin", "provider", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];
