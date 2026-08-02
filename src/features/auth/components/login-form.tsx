"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import {
  requestEmailOtp,
  requestPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "../actions";
import type { AuthActionResult } from "../types";

type Method = "email" | "phone";
type Step = "request" | "verify";

const ERROR_KEYS = new Set([
  "invalid_email",
  "invalid_phone",
  "invalid_otp",
  "otp_request_failed",
  "otp_verify_failed",
]);

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("request");
  const [contact, setContact] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resolveError = (result: Extract<AuthActionResult, { ok: false }>) =>
    t(`errors.${ERROR_KEYS.has(result.error) ? result.error : "generic"}`);

  function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result =
          method === "email"
            ? await requestEmailOtp(contact)
            : await requestPhoneOtp(contact);
        if (result.ok) {
          setStep("verify");
        } else {
          setError(resolveError(result));
        }
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result =
          method === "email"
            ? await verifyEmailOtp(contact, token)
            : await verifyPhoneOtp(contact, token);
        if (result.ok) {
          router.replace("/");
          router.refresh();
        } else {
          setError(resolveError(result));
        }
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setStep("request");
    setContact("");
    setToken("");
    setError(null);
  }

  function resetToRequest() {
    setStep("request");
    setToken("");
    setError(null);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {step === "request" && (
        <>
          <div
            role="tablist"
            aria-label={t("title")}
            className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1"
          >
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={method === m}
                onClick={() => switchMethod(m)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  method === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {m === "email" ? t("emailTab") : t("phoneTab")}
              </button>
            ))}
          </div>

          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">
                {method === "email" ? t("emailLabel") : t("phoneLabel")}
              </Label>
              <Input
                id="contact"
                name="contact"
                type={method === "email" ? "email" : "tel"}
                inputMode={method === "email" ? "email" : "tel"}
                autoComplete={method === "email" ? "email" : "tel"}
                dir="ltr"
                required
                value={contact}
                placeholder={
                  method === "email"
                    ? t("emailPlaceholder")
                    : t("phonePlaceholder")
                }
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isPending || contact.length === 0}>
              {t("sendCode")}
            </Button>
          </form>
        </>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            {t(method === "email" ? "sentToEmail" : "sentToPhone", { contact })}
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="token">{t("otpLabel")}</Label>
            <Input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              dir="ltr"
              required
              value={token}
              placeholder={t("otpPlaceholder")}
              onChange={(e) =>
                setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending || token.length !== 6}>
            {t("verify")}
          </Button>
          <button
            type="button"
            onClick={resetToRequest}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            {method === "email" ? t("changeEmail") : t("changePhone")}
          </button>
        </form>
      )}
    </div>
  );
}
