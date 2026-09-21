import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { Invoice } from "./logic";

const invoiceRowSchema = z.object({
  id: z.string(),
  provider_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["due", "paid", "void"]),
  due_at: z.string(),
  paid_at: z.string().nullable(),
  payment_method: z.string().nullable(),
  reference: z.string().nullable(),
  created_at: z.string(),
  providers: z
    .object({
      business_name_en: z.string(),
      business_name_ar: z.string(),
      country_id: z.string().nullable(),
    })
    .nullable(),
});

export interface InvoiceWithProvider extends Invoice {
  providerNameEn: string;
  providerNameAr: string;
  countryId: string | null;
}

/**
 * Every subscription invoice with its provider's name and country, newest
 * first. Admin-only in practice (RLS shows a provider just their own).
 * Fine at this scale; add pagination once invoices number in the thousands.
 */
export async function listInvoices(): Promise<InvoiceWithProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_invoices")
    .select(
      "id, provider_id, amount, currency, status, due_at, paid_at, payment_method, reference, created_at, providers(business_name_en, business_name_ar, country_id)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return z
    .array(invoiceRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      id: row.id,
      providerId: row.provider_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      dueAt: row.due_at,
      paidAt: row.paid_at,
      paymentMethod: row.payment_method,
      reference: row.reference,
      createdAt: row.created_at,
      providerNameEn: row.providers?.business_name_en ?? "",
      providerNameAr: row.providers?.business_name_ar ?? "",
      countryId: row.providers?.country_id ?? null,
    }));
}

/** Open (or reuse) the annual-membership invoice for a provider. */
export async function issueSubscriptionInvoice(
  providerId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_subscription_invoice", {
    p_provider_id: providerId,
  });
  if (error) throw new Error(error.message);
}

/** Record a manual payment; also starts/extends the provider's subscription. */
export async function recordSubscriptionPayment(
  invoiceId: string,
  method: string,
  reference: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_subscription_payment", {
    p_invoice_id: invoiceId,
    p_method: method,
    p_reference: reference,
  });
  if (error) throw new Error(error.message);
}

export async function voidSubscriptionInvoice(
  invoiceId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_subscription_invoice", {
    p_invoice_id: invoiceId,
  });
  if (error) throw new Error(error.message);
}

export type { Invoice, EffectiveStatus } from "./logic";
export { effectiveStatus, monthlyRevenue, paidBetween, toCsv } from "./logic";
