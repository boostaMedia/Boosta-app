import { requireApiUser } from "@/features/auth";
import { getMessagesService } from "@/features/messages";
import { jsonOk, route } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/conversations/:id — a participant of the conversation (RLS). */
export const GET = route<Context>(async (_request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const service = await getMessagesService();
  return jsonOk(await service.getConversation(id));
});
