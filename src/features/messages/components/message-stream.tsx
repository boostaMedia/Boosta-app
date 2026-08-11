"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { Message } from "../types";

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachments: unknown[];
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  type: Message["type"];
  payment_request_id: string | null;
}

function fromRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    attachments: row.attachments,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    type: row.type,
    paymentRequestId: row.payment_request_id,
  };
}

/**
 * Renders the message thread and subscribes to new inserts via Realtime.
 * The sender's own messages arrive the same way as the other party's — they
 * are also a subscriber and RLS lets them see their own row — so there is no
 * separate optimistic-append path to reconcile.
 */
export function MessageStream({
  conversationId,
  viewerId,
  initialMessages,
}: {
  conversationId: string;
  viewerId: string;
  initialMessages: Message[];
}) {
  const t = useTranslations("chatScreen");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = fromRow(payload.new as MessageRow);
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <main className="flex-1 space-y-2 px-4 py-4">
      {messages.map((m) => {
        if (m.type === "system") {
          return (
            <div key={m.id} className="flex justify-center py-1">
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
                {m.body}
              </span>
            </div>
          );
        }

        const mine = m.senderId === viewerId;
        const content =
          m.type === "text"
            ? m.body
            : m.type === "payment_request"
              ? t("paymentRequestPlaceholder")
              : t("attachmentPlaceholder");

        return (
          <div
            key={m.id}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                mine
                  ? "bg-brand-gradient rounded-ee-md text-white"
                  : "bg-card border-border rounded-es-md border",
              )}
            >
              {content}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </main>
  );
}
