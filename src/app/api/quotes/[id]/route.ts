import { requireApiUser } from "@/features/auth";
import { getQuotesService, updateQuoteRequestSchema } from "@/features/quotes";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/quotes/:id — visible to participants / bidding providers (RLS). */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getQuotesService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/quotes/:id — the owning customer edits/cancels. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateQuoteRequestSchema);
  const service = await getQuotesService();
  return jsonOk(await service.update(id, input));
});

/** DELETE /api/quotes/:id — the owning customer soft-deletes. */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getQuotesService();
  await service.remove(id);
  return jsonNoContent();
});
