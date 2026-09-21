import { SlidersHorizontal, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ScreenHeader } from "@/components/app/screen-header";
import { getCategoriesService } from "@/features/categories";
import { getProvidersService } from "@/features/providers";
import type { Provider } from "@/features/providers";
import { getAppUser } from "@/features/auth";
import { getUsersService } from "@/features/users";
import { getServicesService } from "@/features/services";
import type { Service } from "@/features/services";
import { Link } from "@/i18n/navigation";
import { currencySymbol, formatAmount } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { cn, initials } from "@/lib/utils";

const log = logger.child({ module: "search-screen" });

const SORTS = ["sortNearest", "sortTopRated", "sortPrice"] as const;
type Sort = (typeof SORTS)[number];

function isSort(value: string | undefined): value is Sort {
  return SORTS.includes(value as Sort);
}

type SearchListing = {
  serviceId: string;
  title: string;
  providerName: string;
  providerSlug: string;
  rating: string;
  reviewsCount: number;
  price: string;
  currency: string;
};

/**
 * Load active services whose owning provider is verified, optionally scoped
 * to a category and a free-text query. Sorting by rating comes for free from
 * the repository's default order; "price" is re-sorted client-side since the
 * repository doesn't support it. There's no geo data model yet, so
 * "sortNearest" falls back to the same default order as "sortTopRated".
 */
async function loadListings(
  locale: string,
  categoryId: string | undefined,
  query: string | undefined,
  sort: Sort,
  countryId: string | null,
): Promise<SearchListing[]> {
  try {
    const services = await getServicesService();
    const { items } = await services.list({
      page: 1,
      pageSize: 50,
      status: "active",
      categoryId,
      search: query,
    });
    if (items.length === 0) return [];

    const providers = await getProvidersService();
    const providerById = new Map(
      (
        await providers.listByIds([...new Set(items.map((s) => s.providerId))])
      ).map((p) => [p.id, p]),
    );

    const listings = items
      .filter((s) => {
        const provider = providerById.get(s.providerId);
        if (provider?.status !== "verified") return false;
        return countryId === null || provider.countryId === countryId;
      })
      .map((s) => toListing(s, locale, providerById));

    if (sort === "sortPrice") {
      return listings.sort((a, b) => Number(a.price) - Number(b.price));
    }
    return listings;
  } catch (error) {
    log.warn("services.search_load_failed", { error });
    return [];
  }
}

function toListing(
  service: Service,
  locale: string,
  providerById: Map<string, Provider>,
): SearchListing {
  const provider = providerById.get(service.providerId);
  return {
    serviceId: service.id,
    title: locale === "ar" ? service.titleAr : service.titleEn,
    providerName: provider
      ? locale === "ar"
        ? provider.businessNameAr
        : provider.businessNameEn
      : "",
    providerSlug: provider?.slug ?? "",
    rating: service.rating.toFixed(1),
    reviewsCount: service.reviewsCount,
    price: formatAmount(service.basePrice, service.currency),
    currency: service.currency,
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    country?: string;
  }>;
}) {
  const { locale } = await params;
  const { category, q, sort: sortParam, country } = await searchParams;
  setRequestLocale(locale);

  const sort: Sort = isSort(sortParam) ? sortParam : "sortTopRated";

  let title: string | null = null;
  if (category) {
    try {
      const categories = await getCategoriesService();
      const found = await categories.get(category);
      title = locale === "ar" ? found.nameAr : found.nameEn;
    } catch (error) {
      log.warn("categories.title_load_failed", { error, category });
    }
  }
  if (!title) {
    const t = await getTranslations({ locale, namespace: "searchScreen" });
    title = t("title");
  }

  // Scope to the signed-in customer's own country by default; anonymous
  // visitors and customers without a country set see everything, and
  // `?country=all` lets anyone widen the scope explicitly.
  let countryId: string | null = null;
  if (country !== "all") {
    const appUser = await getAppUser();
    if (appUser) {
      try {
        const users = await getUsersService();
        countryId = (await users.getMe(appUser.id)).profile?.countryId ?? null;
      } catch (error) {
        log.warn("search.country_load_failed", { error });
      }
    }
  }

  const listings = await loadListings(locale, category, q, sort, countryId);

  return (
    <SearchResults
      title={title}
      listings={listings}
      activeSort={sort}
      category={category}
      query={q}
      scopedToCountry={countryId !== null}
      allCountries={country === "all"}
    />
  );
}

function sortHref(
  sort: Sort,
  category?: string,
  query?: string,
  allCountries?: boolean,
): string {
  const params = new URLSearchParams({ sort });
  if (category) params.set("category", category);
  if (query) params.set("q", query);
  if (allCountries) params.set("country", "all");
  return `/search?${params.toString()}`;
}

function SearchResults({
  title,
  listings,
  activeSort,
  category,
  query,
  scopedToCountry,
  allCountries,
}: {
  title: string;
  listings: SearchListing[];
  activeSort: Sort;
  category?: string;
  query?: string;
  scopedToCountry: boolean;
  allCountries: boolean;
}) {
  const t = useTranslations("searchScreen");
  const locale = useLocale();

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <ScreenHeader title={title} backHref="/categories" />

      {/* Sort + filter row */}
      <div className="border-border flex items-center gap-2 overflow-x-auto border-b px-4 py-2.5">
        {SORTS.map((s) => (
          <Link
            key={s}
            href={sortHref(s, category, query, allCountries)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
              activeSort === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground border",
            )}
          >
            {t(s)}
          </Link>
        ))}
        <button
          type="button"
          className="bg-card border-border ms-auto flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("filter")}
        </button>
      </div>

      <main className="flex-1 space-y-3 px-4 py-4">
        {scopedToCountry && (
          <p className="text-muted-foreground text-xs">
            {t("scopedToCountry")}{" "}
            <Link
              href={sortHref(activeSort, category, query, true)}
              className="text-primary font-medium"
            >
              {t("showAllCountries")}
            </Link>
          </p>
        )}
        {listings.length === 0 ? (
          <div className="border-border bg-card mt-6 rounded-2xl border border-dashed p-6 text-center">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          listings.map((l) => (
            <Link
              key={l.serviceId}
              href={l.providerSlug ? `/provider/${l.providerSlug}` : "/search"}
              className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3 shadow-sm"
            >
              <div className="bg-brand-gradient grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">
                {initials(l.providerName)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{l.title}</h2>
                <p className="text-muted-foreground truncate text-xs">
                  {l.providerName}
                </p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                  <Star
                    className="size-3.5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  <span className="text-foreground font-medium">
                    {l.rating}
                  </span>
                  <span>({t("reviews", { count: l.reviewsCount })})</span>
                </p>
              </div>
              <div className="text-primary shrink-0 text-end text-sm font-bold">
                {l.price}
                <span className="text-muted-foreground block text-[10px] font-normal">
                  {currencySymbol(l.currency, locale)}
                </span>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
