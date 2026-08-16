import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/features/auth";
import { getProvidersService } from "@/features/providers";
import type { Provider, ProviderStatus } from "@/features/providers";
import { ProviderStatusActions } from "@/features/providers/components/status-actions";
import { getUsersService } from "@/features/users";
import { Link } from "@/i18n/navigation";
import { NotFoundError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<ProviderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  verified: "bg-success/12 text-success",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-muted text-muted-foreground",
};

async function loadOwnerContact(
  userId: string,
): Promise<{ email: string | null; phone: string | null } | null> {
  try {
    const users = await getUsersService();
    const account = await users.get(userId);
    return { email: account.email, phone: account.phone };
  } catch {
    return null;
  }
}

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const providers = await getProvidersService();
  let provider: Provider;
  try {
    provider = await providers.get(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const owner = await loadOwnerContact(provider.userId);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8">
      <BackLink />
      <ProviderDetail
        provider={provider}
        ownerEmail={owner?.email ?? null}
        ownerPhone={owner?.phone ?? null}
      />
    </div>
  );
}

function BackLink() {
  const t = useTranslations("adminProviderDetailScreen");
  return (
    <Link
      href="/admin"
      className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm font-medium"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {t("back")}
    </Link>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border-border space-y-3 rounded-2xl border p-4 shadow-sm">
      <h2 className="font-heading text-sm font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ProviderDetail({
  provider,
  ownerEmail,
  ownerPhone,
}: {
  provider: Provider;
  ownerEmail: string | null;
  ownerPhone: string | null;
}) {
  const t = useTranslations("adminProviderDetailScreen");
  const locale = useLocale();

  const description =
    locale === "ar" ? provider.descriptionAr : provider.descriptionEn;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-extrabold">
          {locale === "ar" ? provider.businessNameAr : provider.businessNameEn}
        </h1>
        <span
          className={cn(
            "mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
            STATUS_CLASSES[provider.status],
          )}
        >
          {t(`status.${provider.status}`)}
        </span>
      </div>

      <Section title={t("businessInfoTitle")}>
        <Field label={t("nameEnLabel")} value={provider.businessNameEn} />
        <Field label={t("nameArLabel")} value={provider.businessNameAr} />
        {description && (
          <div className="sm:col-span-2">
            <Field label={t("descriptionLabel")} value={description} />
          </div>
        )}
        {ownerEmail && <Field label={t("emailLabel")} value={ownerEmail} />}
        {ownerPhone && <Field label={t("phoneLabel")} value={ownerPhone} />}
      </Section>

      <Section title={t("contractTitle")}>
        <Field
          label={t("signedNameLabel")}
          value={provider.contractSignedName ?? "—"}
        />
        <Field
          label={t("contractVersionLabel")}
          value={provider.contractVersion ?? "—"}
        />
        <div className="sm:col-span-2">
          <Field
            label={t("acceptedAtLabel")}
            value={
              provider.contractAcceptedAt
                ? new Date(provider.contractAcceptedAt).toLocaleString(
                    locale === "ar" ? "ar-KW" : "en-KW",
                  )
                : "—"
            }
          />
        </div>
      </Section>

      <ProviderStatusActions
        providerId={provider.id}
        status={provider.status}
      />
    </div>
  );
}
