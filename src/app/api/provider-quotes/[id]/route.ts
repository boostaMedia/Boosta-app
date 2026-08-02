import { requireApiUser } from "@/features/auth";
import {
  getProviderQuotesService,
  updateProviderQuoteSchema,
} from "@/features/provider-quotes";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/provider-quotes/:id — provider owner or requesting customer (RLS). */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getProviderQuotesService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/provider-quotes/:id — the owning provider edits/withdraws. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateProviderQuoteSchema);
  const service = await getProviderQuotesService();
  return jsonOk(await service.update(id, input));
});
