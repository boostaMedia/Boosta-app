import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

export default async function SplashPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Splash />;
}

function Splash() {
  const t = useTranslations("splashScreen");
  const tOnboarding = useTranslations("onboardingScreen");

  return (
    <div className="bg-brand-gradient mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-between px-6 py-16 text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {/* Logo inverted to white on the brand gradient */}
        <Logo priority className="h-20 brightness-0 invert" />
        <p className="text-lg font-medium text-white/90">{t("tagline")}</p>
      </div>

      <Link
        href="/onboarding"
        className="text-brand flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold shadow-md transition-transform active:scale-[0.99]"
      >
        {tOnboarding("getStarted")}
      </Link>
    </div>
  );
}
