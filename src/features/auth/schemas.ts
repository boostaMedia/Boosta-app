import { z } from "zod";

/** E.164 phone number (supports Kuwait & the wider GCC). */
export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "invalid_phone");

/** A 6-digit one-time passcode. */
export const otpTokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "invalid_otp");

export const emailSchema = z.email();

export const requestEmailOtpSchema = z.object({
  email: emailSchema,
});

export const requestPhoneOtpSchema = z.object({
  phone: phoneNumberSchema,
});

export const verifyEmailOtpSchema = z.object({
  email: emailSchema,
  token: otpTokenSchema,
});

export const verifyPhoneOtpSchema = z.object({
  phone: phoneNumberSchema,
  token: otpTokenSchema,
});

export type RequestEmailOtpInput = z.infer<typeof requestEmailOtpSchema>;
export type RequestPhoneOtpInput = z.infer<typeof requestPhoneOtpSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
