import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireProvider } from "@/features/auth";
import { getCategoriesService } from "@/features/categories";
import { getCurrentProviderId } from "@/features/providers";
import { CreateServiceForm } from "@/features/services/components/create-service-form";
import { Link } from "@/i18n/navigation";

export default async function NewServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProvider();

  const providerId = await getCurrentProviderId();
  if (!providerId) redirect(`/${locale}/dashboard`);

  const categoriesService = await getCategoriesService();
  const { items: categories } = await categoriesService.list({
    page: 1,
    pageSize: 50,
    activeOnly: true,
  });

  const t = await getTranslations({ locale, namespace: "addServiceScreen" });

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-2.5 backdrop-blur">
        <Link
          href="/dashboard/services"
          aria-label={t("back")}
          className="hover:bg-muted grid size-9 place-items-center rounded-full"
        >
          <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
        </Link>
        <p className="text-sm font-bold">{t("title")}</p>
      </header>

      <CreateServiceForm
        categories={categories.map((c) => ({
          id: c.id,
          nameEn: c.nameEn,
          nameAr: c.nameAr,
        }))}
      />
    </div>
  );
}
