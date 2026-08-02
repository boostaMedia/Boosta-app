import { requireApiUser } from "@/features/auth";
import {
  createMessageSchema,
  getMessagesService,
  listMessagesQuerySchema,
} from "@/features/messages";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

/** GET /api/conversations/:id/messages — messages in the thread (RLS-scoped). */
export const GET = route<Context>(async (request, { params }) => {
  await requireApiUser();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listMessagesQuerySchema);
  const service = await getMessagesService();
  return jsonPaginated(await service.listMessages(id, query));
});

/** POST /api/conversations/:id/messages — send a message as the caller. */
export const POST = route<Context>(async (request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const input = await parseBody(request, createMessageSchema);
  const service = await getMessagesService();
  return jsonCreated(await service.sendMessage(id, user.id, input));
});
