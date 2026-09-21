import { getAppUser } from "@/features/auth";
import { effectiveStatus, listInvoices, toCsv } from "@/features/billing";
import { listCountries } from "@/features/reference";

/** GET /api/admin/invoices/export — all subscription invoices as an Excel-friendly CSV. */
export async function GET() {
  const user = await getAppUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "admin") return new Response("Forbidden", { status: 403 });

  const [invoices, countries] = await Promise.all([
    listInvoices(),
    listCountries().catch(() => []),
  ]);
  const countryName = new Map(countries.map((c) => [c.id, c.nameEn]));
  const now = new Date();

  const csv = toCsv([
    [
      "Provider",
      "Country",
      "Amount",
      "Currency",
      "Status",
      "Due",
      "Paid",
      "Method",
      "Reference",
    ],
    ...invoices.map((i) => [
      i.providerNameEn,
      countryName.get(i.countryId ?? "") ?? "",
      i.amount,
      i.currency,
      effectiveStatus(i, now),
      i.dueAt.slice(0, 10),
      i.paidAt ? i.paidAt.slice(0, 10) : "",
      i.paymentMethod ?? "",
      i.reference ?? "",
    ]),
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${now.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
