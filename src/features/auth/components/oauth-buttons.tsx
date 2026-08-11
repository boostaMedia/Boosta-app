"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C39.9 37.2 44 31.3 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.462 2.05-1.04 2.7-.633.717-1.68 1.267-2.575 1.267-.1-1.096.44-2.145 1.028-2.744C14.404 1.94 15.518 1.4 16.365 1.43zM20.7 17.19c-.416.965-.918 1.874-1.518 2.71-.812 1.14-1.478 1.928-2.34 1.928-.87 0-1.09-.554-2.263-.554-1.172 0-1.454.554-2.322.554-.862 0-1.5-.86-2.317-1.99-1.66-2.28-2.93-6.437-1.226-9.24.847-1.39 2.354-2.27 3.995-2.29 1.09-.02 2.09.686 2.75.686.66 0 1.9-.847 3.2-.723.545.023 2.078.22 3.06 1.66-.08.05-1.828 1.07-1.81 3.19.02 2.53 2.22 3.37 2.242 3.38-.02.06-.35 1.2-1.15 2.69z" />
    </svg>
  );
}

export function OAuthButtons({
  signupRole,
}: {
  signupRole?: "customer" | "provider";
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [pendingProvider, setPendingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: "google" | "apple") {
    setError(null);
    setPendingProvider(provider);

    const params = new URLSearchParams({ locale });
    if (signupRole) params.set("role", signupRole);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?${params.toString()}`,
      },
    });
    if (oauthError) {
      setError(t("errors.oauth_failed"));
      setPendingProvider(null);
    }
    // On success the browser is already navigating away to the provider.
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {error && (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => signInWith("google")}
        disabled={pendingProvider !== null}
        className="border-input bg-card hover:bg-muted/50 flex h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        {t("continueWithGoogle")}
      </button>
      <button
        type="button"
        onClick={() => signInWith("apple")}
        disabled={pendingProvider !== null}
        className="border-input bg-card hover:bg-muted/50 flex h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors disabled:opacity-50"
      >
        <AppleIcon />
        {t("continueWithApple")}
      </button>
    </div>
  );
}
