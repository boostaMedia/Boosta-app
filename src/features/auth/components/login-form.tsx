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
  signInWithPassword,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "../actions";
import type { AuthActionResult } from "../types";
import { OAuthButtons } from "./oauth-buttons";

type Method = "email" | "phone" | "password";
type Step = "request" | "verify";

const ERROR_KEYS = new Set([
  "invalid_email",
  "invalid_phone",
  "invalid_otp",
  "invalid_credentials",
  "otp_request_failed",
  "otp_verify_failed",
]);

export function LoginForm({
  signupRole,
}: {
  signupRole?: "customer" | "provider";
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("request");
  const [contact, setContact] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resolveError = (result: Extract<AuthActionResult, { ok: false }>) =>
    t(`errors.${ERROR_KEYS.has(result.error) ? result.error : "generic"}`);

  function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (method === "password") {
          const signedIn = await signInWithPassword(contact, password);
          if (signedIn.ok) {
            router.replace(signedIn.redirectTo ?? "/home");
            router.refresh();
          } else {
            setError(resolveError(signedIn));
          }
          return;
        }
        const result =
          method === "email"
            ? await requestEmailOtp(contact, signupRole)
            : await requestPhoneOtp(contact, signupRole);
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
          router.replace(result.redirectTo ?? "/home");
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
    setPassword("");
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
        {signupRole && (
          <p className="text-primary text-xs font-semibold">
            {t(
              signupRole === "provider"
                ? "signingUpAsBusiness"
                : "signingUpAsIndividual",
            )}
          </p>
        )}
      </div>

      {step === "request" && (
        <>
          <OAuthButtons signupRole={signupRole} />

          <div className="flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">
              {t("orContinueWith")}
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div
            role="tablist"
            aria-label={t("title")}
            className="bg-muted grid grid-cols-3 gap-1 rounded-lg p-1"
          >
            {(["email", "phone", "password"] as const).map((m) => (
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
                {m === "email"
                  ? t("emailTab")
                  : m === "phone"
                    ? t("phoneTab")
                    : t("passwordTab")}
              </button>
            ))}
          </div>

          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">
                {method === "phone" ? t("phoneLabel") : t("emailLabel")}
              </Label>
              <Input
                id="contact"
                name="contact"
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "tel" : "email"}
                autoComplete={method === "phone" ? "tel" : "email"}
                dir="ltr"
                required
                value={contact}
                placeholder={
                  method === "phone"
                    ? t("phonePlaceholder")
                    : t("emailPlaceholder")
                }
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            {method === "password" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t("passwordLabel")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  dir="ltr"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                isPending ||
                contact.length === 0 ||
                (method === "password" && password.length === 0)
              }
            >
              {method === "password" ? t("signIn") : t("sendCode")}
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
