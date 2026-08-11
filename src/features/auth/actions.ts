"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import { getAppUser } from "./queries";
import { postLoginPath } from "./routes";
import {
  requestEmailOtpSchema,
  requestPhoneOtpSchema,
  verifyEmailOtpSchema,
  verifyPhoneOtpSchema,
} from "./schemas";
import type { AuthActionResult } from "./types";

const log = logger.child({ module: "auth" });

/**
 * Send a one-time passcode to an email address (creates the user if new).
 * `signupRole` only affects account creation — it is written into the new
 * auth user's metadata, which the `handle_new_user` trigger reads to set
 * `public.users.role`. It has no effect for an existing account (the trigger
 * only fires on insert), so a returning user's role can never change here.
 */
export async function requestEmailOtp(
  email: string,
  signupRole?: string,
): Promise<AuthActionResult> {
  const parsed = requestEmailOtpSchema.safeParse({ email, signupRole });
  if (!parsed.success) return { ok: false, error: "invalid_email" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      data: parsed.data.signupRole
        ? { role: parsed.data.signupRole }
        : undefined,
    },
  });

  if (error) {
    log.warn("email_otp.request_failed", { error });
    return { ok: false, error: "otp_request_failed" };
  }
  return { ok: true };
}

/** Verify an email OTP; on success the session cookies are established. */
export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<AuthActionResult> {
  const parsed = verifyEmailOtpSchema.safeParse({ email, token });
  if (!parsed.success) return { ok: false, error: "invalid_otp" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) {
    log.warn("email_otp.verify_failed", { error });
    return { ok: false, error: "otp_verify_failed" };
  }
  const user = await getAppUser();
  return { ok: true, redirectTo: user ? postLoginPath(user.role) : "/home" };
}

/** Send a one-time passcode to a phone number via SMS. Same `signupRole` semantics as {@link requestEmailOtp}. */
export async function requestPhoneOtp(
  phone: string,
  signupRole?: string,
): Promise<AuthActionResult> {
  const parsed = requestPhoneOtpSchema.safeParse({ phone, signupRole });
  if (!parsed.success) return { ok: false, error: "invalid_phone" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    options: {
      shouldCreateUser: true,
      data: parsed.data.signupRole
        ? { role: parsed.data.signupRole }
        : undefined,
    },
  });

  if (error) {
    log.warn("phone_otp.request_failed", { error });
    return { ok: false, error: "otp_request_failed" };
  }
  return { ok: true };
}

/** Verify a phone OTP; on success the session cookies are established. */
export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<AuthActionResult> {
  const parsed = verifyPhoneOtpSchema.safeParse({ phone, token });
  if (!parsed.success) return { ok: false, error: "invalid_otp" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: "sms",
  });

  if (error) {
    log.warn("phone_otp.verify_failed", { error });
    return { ok: false, error: "otp_verify_failed" };
  }
  const user = await getAppUser();
  return { ok: true, redirectTo: user ? postLoginPath(user.role) : "/home" };
}

/** Sign the current user out, clearing their session. */
export async function signOut(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    log.warn("sign_out.failed", { error });
    return { ok: false, error: "sign_out_failed" };
  }
  return { ok: true };
}
