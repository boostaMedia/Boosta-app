import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/features/auth/components/login-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title") };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { locale } = await params;
  const { role } = await searchParams;
  setRequestLocale(locale);

  const signupRole =
    role === "provider" || role === "customer" ? role : undefined;

  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6">
      <div className="pt-6">
        <Link
          href="/"
          aria-label={t("backToHome")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("backToHome")}
        </Link>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center py-10">
        <LoginForm signupRole={signupRole} />
      </main>
    </div>
  );
}
