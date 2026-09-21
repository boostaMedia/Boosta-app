export type InvoiceStatus = "due" | "paid" | "void";
export type EffectiveStatus = InvoiceStatus | "overdue";

export interface Invoice {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
  reference: string | null;
  createdAt: string;
}

/** Overdue isn't stored: it's an open invoice past its due date. */
export function effectiveStatus(inv: Invoice, now: Date): EffectiveStatus {
  if (inv.status === "due" && new Date(inv.dueAt).getTime() < now.getTime()) {
    return "overdue";
  }
  return inv.status;
}

export interface MonthTotal {
  /** UTC month, `YYYY-MM`. */
  month: string;
  total: number;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Paid revenue per UTC calendar month for the last `months` months ending at
 * `now`'s month, oldest first. Months with no payments are present with 0 so
 * a chart doesn't skip them.
 */
export function monthlyRevenue(
  invoices: Invoice[],
  now: Date,
  months = 6,
): MonthTotal[] {
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    buckets.set(monthKey(d), 0);
  }
  for (const inv of invoices) {
    if (inv.status !== "paid" || !inv.paidAt) continue;
    const key = monthKey(new Date(inv.paidAt));
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + inv.amount);
  }
  return [...buckets].map(([month, total]) => ({ month, total }));
}

/** Sum of paid invoices whose paidAt falls in [from, to). */
export function paidBetween(invoices: Invoice[], from: Date, to: Date): number {
  return invoices.reduce((sum, inv) => {
    if (inv.status !== "paid" || !inv.paidAt) return sum;
    const t = new Date(inv.paidAt).getTime();
    return t >= from.getTime() && t < to.getTime() ? sum + inv.amount : sum;
  }, 0);
}

/**
 * Build a CSV that opens cleanly in Excel: BOM for Arabic text, CRLF rows,
 * quotes escaped. Cells that would be read as a formula (=, +, -, @) get a
 * leading apostrophe, since provider names are user-supplied.
 */
export function toCsv(rows: (string | number | null)[][]): string {
  const cell = (value: string | number | null): string => {
    if (value === null) return "";
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
      text = `'${text}`;
    }
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `﻿${rows.map((r) => r.map(cell).join(",")).join("\r\n")}\r\n`;
}
