import { redirect } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ProviderBottomNav } from "@/components/app/provider-bottom-nav";
import { requireProvider } from "@/features/auth";
import { getCurrentProvider } from "@/features/providers";
import { getReviewsService } from "@/features/reviews";
import type { Review } from "@/features/reviews";
import { ReplyForm } from "@/features/reviews/components/reply-form";
import { StarRating } from "@/features/reviews/components/star-rating";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "provider-reviews-screen" });

export default async function ProviderReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProvider();

  const provider = await getCurrentProvider();
  if (!provider || provider.status !== "verified") {
    redirect(`/${locale}/dashboard`);
  }

  let reviews: Review[] = [];
  try {
    ({ items: reviews } = await (
      await getReviewsService()
    ).list({ page: 1, pageSize: 50, providerId: provider.id }));
  } catch (error) {
    log.warn("provider_reviews.load_failed", { error });
  }

  return <ProviderReviews reviews={reviews} />;
}

function ProviderReviews({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("reviews");
  const locale = useLocale();

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">
          {t("providerTitle")}
        </h1>
        <p className="text-muted-foreground text-xs">{t("providerSubtitle")}</p>
      </header>

      <main className="flex-1 space-y-3 px-4 py-2">
        {reviews.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border border-dashed p-6 text-center">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <article
              key={r.id}
              className="bg-card border-border space-y-2 rounded-2xl border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <span className="text-muted-foreground text-xs">
                  {new Date(r.createdAt).toLocaleDateString(
                    locale === "ar" ? "ar-KW" : "en-KW",
                  )}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm whitespace-pre-line">{r.comment}</p>
              )}
              {r.providerReply && (
                <p className="bg-muted/50 rounded-lg p-2 text-sm">
                  <span className="text-muted-foreground block text-xs">
                    {t("yourReply")}
                  </span>
                  {r.providerReply}
                </p>
              )}
              <ReplyForm reviewId={r.id} initial={r.providerReply} />
            </article>
          ))
        )}
      </main>

      <ProviderBottomNav active="dashboard" />
    </div>
  );
}
