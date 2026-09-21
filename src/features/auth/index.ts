/**
 * Public API for the auth feature.
 *
 * Server-only exports (queries, guards) must only be imported from Server
 * Components, Server Actions, or Route Handlers.
 */
export {
  requestEmailOtp,
  requestPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
  signInWithPassword,
  signOut,
} from "./actions";
export { getAppUser, getAuthUser } from "./queries";
export {
  requireUser,
  requireRole,
  requireAdmin,
  requireProvider,
  requireCustomer,
} from "./guards";
export { requireApiUser, requireApiRole } from "./api-guards";
export { postLoginPath } from "./routes";
export type { AppUser, AuthUser, AuthActionResult } from "./types";
export { signupRoleSchema } from "./schemas";
