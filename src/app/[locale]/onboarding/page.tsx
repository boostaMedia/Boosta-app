import { setRequestLocale } from "next-intl/server";

import { Onboarding } from "./onboarding";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Onboarding />;
}
