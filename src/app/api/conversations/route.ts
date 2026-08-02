import { requireApiUser } from "@/features/auth";
import {
  createConversationSchema,
  getMessagesService,
  listConversationsQuerySchema,
} from "@/features/messages";
import {
  jsonCreated,
  jsonPaginated,
  parseBody,
  parseQuery,
  route,
} from "@/lib/api";

/** GET /api/conversations — the caller's conversations (participant via RLS). */
export const GET = route(async (request) => {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const query = parseQuery(searchParams, listConversationsQuerySchema);
  const service = await getMessagesService();
  return jsonPaginated(await service.listConversations(query));
});

/** POST /api/conversations — the authenticated customer starts a thread. */
export const POST = route(async (request) => {
  const user = await requireApiUser();
  const input = await parseBody(request, createConversationSchema);
  const service = await getMessagesService();
  return jsonCreated(await service.createConversation(user.id, input));
});
