import { requireApiUser } from "@/features/auth";
import { getPaymentsService } from "@/features/payments";
import { jsonOk, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/payments/:id — payer, related provider, or admin (RLS). */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getPaymentsService();
  return jsonOk(await service.get(id));
});
