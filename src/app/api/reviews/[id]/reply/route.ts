import { requireApiUser } from "@/features/auth";
import { getReviewsService, replyReviewSchema } from "@/features/reviews";
import { jsonOk, parseBody, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/reviews/:id/reply — the reviewed provider appends a public reply.
 * RLS restricts this to the provider who owns the review's provider row.
 */
export const POST = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const { reply } = await parseBody(request, replyReviewSchema);
  const service = await getReviewsService();
  return jsonOk(await service.reply(id, reply));
});
