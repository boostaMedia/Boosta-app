"use server";

import { requireUser } from "@/features/auth/guards";
import { logger } from "@/lib/logger";

import { getMessagesService } from "./index";
import type { Message } from "./types";

const log = logger.child({ module: "messages" });

export type SendMessageResult =
  | { ok: true; message: Message }
  | { ok: false; error: "empty" | "too_long" | "send_failed" };

/** Send a text message into a conversation. The caller must be a participant — enforced by the messages RLS policy, not just this check. */
export async function sendMessageAction(
  conversationId: string,
  body: string,
): Promise<SendMessageResult> {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "empty" };
  if (trimmed.length > 4000) return { ok: false, error: "too_long" };

  const user = await requireUser();

  try {
    const service = await getMessagesService();
    const message = await service.sendMessage(conversationId, user.id, {
      body: trimmed,
      attachments: [],
    });
    return { ok: true, message };
  } catch (error) {
    log.warn("send_message.failed", { error, conversationId });
    return { ok: false, error: "send_failed" };
  }
}
