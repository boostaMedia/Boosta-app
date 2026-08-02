import { requireApiUser } from "@/features/auth";
import { getOffersService, updateOfferSchema } from "@/features/offers";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/offers/:id — public. */
export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const service = await getOffersService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/offers/:id — owner (or admin) edits. RLS enforces ownership. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateOfferSchema);
  const service = await getOffersService();
  return jsonOk(await service.update(id, input));
});

/** DELETE /api/offers/:id — owner (or admin) soft-deletes. */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getOffersService();
  await service.remove(id);
  return jsonNoContent();
});
