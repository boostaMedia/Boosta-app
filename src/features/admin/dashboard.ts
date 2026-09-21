import "server-only";

import { listCountries } from "@/features/reference";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  activeSubscriptions: number;
  expiringSoon: number;
  pendingProviders: number;
  verifiedProviders: number;
  suspendedProviders: number;
  customers: number;
  bookingsThisMonth: number;
  bookingsInProgress: number;
  subscriptionsByCountry: {
    countryId: string;
    nameEn: string;
    nameAr: string;
    count: number;
  }[];
}

export interface ActivityItem {
  kind: "provider" | "payment" | "booking";
  label: string;
  at: string;
}

function startOfMonthUtc(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

type CountResult = PromiseLike<{ count: number | null; error: unknown }>;

/** A failed count reads as 0 rather than breaking the whole dashboard. */
const n = (result: CountResult): Promise<number> =>
  Promise.resolve(result).then((r) => (r.error ? 0 : (r.count ?? 0)));

/** Headline numbers for the admin dashboard. Admin-only via RLS. */
export async function getDashboardStats(
  now = new Date(),
): Promise<DashboardStats> {
  const supabase = await createClient();
  const nowIso = now.toISOString();
  const in30 = new Date(now.getTime() + 30 * 86_400_000).toISOString();
  const monthStart = startOfMonthUtc(now);
  const head = { count: "exact", head: true } as const;

  const subs = () => supabase.from("provider_subscriptions").select("id", head);
  const providers = () =>
    supabase.from("providers").select("id", head).is("deleted_at", null);
  const orders = () =>
    supabase.from("orders").select("id", head).is("deleted_at", null);

  const [
    activeSubscriptions,
    expiringSoon,
    pendingProviders,
    verifiedProviders,
    suspendedProviders,
    customers,
    bookingsThisMonth,
    bookingsInProgress,
    subscriptionsByCountry,
  ] = await Promise.all([
    n(subs().eq("status", "active").gt("current_period_end", nowIso)),
    n(
      subs()
        .eq("status", "active")
        .gt("current_period_end", nowIso)
        .lte("current_period_end", in30),
    ),
    n(providers().eq("status", "pending")),
    n(providers().eq("status", "verified")),
    n(providers().eq("status", "suspended")),
    n(supabase.from("users").select("id", head).eq("role", "customer")),
    n(orders().gte("created_at", monthStart)),
    n(orders().eq("status", "in_progress")),
    loadSubscriptionsByCountry(nowIso),
  ]);

  return {
    activeSubscriptions,
    expiringSoon,
    pendingProviders,
    verifiedProviders,
    suspendedProviders,
    customers,
    bookingsThisMonth,
    bookingsInProgress,
    subscriptionsByCountry,
  };
}

async function loadSubscriptionsByCountry(
  nowIso: string,
): Promise<DashboardStats["subscriptionsByCountry"]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provider_subscriptions")
    .select("providers(country_id)")
    .eq("status", "active")
    .gt("current_period_end", nowIso);
  if (error) return [];

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as unknown as {
    providers: { country_id: string | null } | null;
  }[]) {
    const id = row.providers?.country_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const countries = await listCountries().catch(() => []);
  return countries
    .map((c) => ({
      countryId: c.id,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      count: counts.get(c.id) ?? 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Latest movements across providers, payments and bookings, merged and
 * newest first. Derived from existing tables — there's no separate event log.
 */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const [providers, payments, orders] = await Promise.all([
    supabase
      .from("providers")
      .select("business_name_en, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("subscription_invoices")
      .select("amount, currency, paid_at, providers(business_name_en)")
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(limit),
    supabase
      .from("orders")
      .select("order_number, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];
  for (const p of providers.data ?? []) {
    items.push({
      kind: "provider",
      label: p.business_name_en,
      at: p.created_at,
    });
  }
  for (const p of (payments.data ?? []) as unknown as {
    amount: number;
    currency: string;
    paid_at: string | null;
    providers: { business_name_en: string } | null;
  }[]) {
    if (p.paid_at) {
      items.push({
        kind: "payment",
        label: `${p.providers?.business_name_en ?? ""} · ${p.amount} ${p.currency}`,
        at: p.paid_at,
      });
    }
  }
  for (const o of orders.data ?? []) {
    items.push({
      kind: "booking",
      label: `#${o.order_number}`,
      at: o.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
