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
export type { AppUser, AuthUser, AuthActionResult } from "./types";
