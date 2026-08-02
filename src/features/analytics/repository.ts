import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** A count query is any thenable resolving to `{ count, error }`. */
type CountQuery = PromiseLike<{
  count: number | null;
  error: { message: string } | null;
}>;

async function toCount(query: CountQuery): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export interface AnalyticsRepository {
  adminOverview(): Promise<Record<string, number>>;
  providerOverview(providerId: string): Promise<Record<string, number>>;
  customerOverview(userId: string): Promise<Record<string, number>>;
}

export function createAnalyticsRepository(
  supabase: SupabaseClient,
): AnalyticsRepository {
  const head = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  return {
    async adminOverview() {
      const [users, providers, services, orders, openQuoteRequests] =
        await Promise.all([
          toCount(head("users")),
          toCount(head("providers").is("deleted_at", null)),
          toCount(head("services").is("deleted_at", null)),
          toCount(head("orders").is("deleted_at", null)),
          toCount(
            head("quote_requests").eq("status", "open").is("deleted_at", null),
          ),
        ]);
      return { users, providers, services, orders, openQuoteRequests };
    },

    async providerOverview(providerId) {
      const [services, offers, orders] = await Promise.all([
        toCount(
          head("services").eq("provider_id", providerId).is("deleted_at", null),
        ),
        toCount(
          head("offers").eq("provider_id", providerId).is("deleted_at", null),
        ),
        toCount(
          head("orders").eq("provider_id", providerId).is("deleted_at", null),
        ),
      ]);
      return { services, offers, orders };
    },

    async customerOverview(userId) {
      const [orders, quoteRequests, favorites] = await Promise.all([
        toCount(
          head("orders").eq("customer_id", userId).is("deleted_at", null),
        ),
        toCount(
          head("quote_requests")
            .eq("customer_id", userId)
            .is("deleted_at", null),
        ),
        toCount(head("favorites").eq("user_id", userId)),
      ]);
      return { orders, quoteRequests, favorites };
    },
  };
}
