import "server-only";

import { createClient } from "@/lib/supabase/server";

import { createMessagesRepository } from "./repository";
import { createMessagesService, type MessagesService } from "./service";

/** Build a messaging service bound to the request's Supabase client. */
export async function getMessagesService(): Promise<MessagesService> {
  const supabase = await createClient();
  return createMessagesService(createMessagesRepository(supabase));
}

export {
  createConversationSchema,
  createMessageSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
} from "./schemas";
export type { Conversation, Message } from "./types";
export type { MessagesService } from "./service";
