import { requireApiUser } from "@/features/auth";
import { getReviewsService, updateReviewSchema } from "@/features/reviews";
import { jsonNoContent, jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/reviews/:id — public. */
export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const service = await getReviewsService();
  return jsonOk(await service.get(id));
});

/** PATCH /api/reviews/:id — the review's author edits it (RLS enforced). */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, updateReviewSchema);
  const service = await getReviewsService();
  return jsonOk(await service.updateOwn(id, input));
});

/** DELETE /api/reviews/:id — author (or admin) soft-deletes. */
export const DELETE = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getReviewsService();
  await service.remove(id);
  return jsonNoContent();
});
