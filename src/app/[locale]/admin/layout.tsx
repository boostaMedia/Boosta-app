import { setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/features/auth";
import { AdminNav } from "@/features/admin/components/admin-nav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <AdminNav />
      {children}
    </div>
  );
}
