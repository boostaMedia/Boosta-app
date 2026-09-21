"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth";
import { logger } from "@/lib/logger";

import { recordSubscriptionPayment, voidSubscriptionInvoice } from "./index";

const log = logger.child({ module: "billing" });

export type BillingResult =
  { ok: true } | { ok: false; error: "invalid" | "failed" };

const paymentSchema = z.object({
  invoiceId: z.uuid(),
  method: z.string().trim().min(1).max(60),
  reference: z.string().trim().max(120),
});

/** Admin: record that an invoice was paid (bank transfer, cash, …). */
export async function recordPaymentAction(input: {
  invoiceId: string;
  method: string;
  reference: string;
}): Promise<BillingResult> {
  await requireAdmin();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    await recordSubscriptionPayment(
      parsed.data.invoiceId,
      parsed.data.method,
      parsed.data.reference,
    );
    revalidatePath("/admin/finance");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    log.warn("record_payment.failed", { error });
    return { ok: false, error: "failed" };
  }
}

/** Admin: cancel an open invoice. */
export async function voidInvoiceAction(
  invoiceId: string,
): Promise<BillingResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(invoiceId).success) {
    return { ok: false, error: "invalid" };
  }
  try {
    await voidSubscriptionInvoice(invoiceId);
    revalidatePath("/admin/finance");
    return { ok: true };
  } catch (error) {
    log.warn("void_invoice.failed", { error });
    return { ok: false, error: "failed" };
  }
}
