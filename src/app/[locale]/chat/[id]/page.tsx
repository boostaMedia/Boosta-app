import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { requireUser } from "@/features/auth/guards";
import { getMessagesService } from "@/features/messages";
import type { Counterparty, Message } from "@/features/messages";
import { Composer } from "@/features/messages/components/composer";
import { MessageStream } from "@/features/messages/components/message-stream";
import { Link } from "@/i18n/navigation";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "chat-screen" });

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser();

  const messages = await getMessagesService();

  // RLS returns nothing for a conversation the caller doesn't participate
  // in, so this also correctly 404s an unauthorized access attempt rather
  // than revealing the conversation exists.
  try {
    await messages.getConversation(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  await messages.markRead(id, user.id).catch((error: unknown) => {
    log.warn("mark_read.failed", { error, conversationId: id });
  });

  const [{ items: initialMessages }, counterparty] = await Promise.all([
    messages.listMessages(id, { page: 1, pageSize: 100 }),
    messages.getCounterparty(id),
  ]);

  return (
    <Chat
      conversationId={id}
      viewerId={user.id}
      counterparty={counterparty}
      initialMessages={initialMessages}
    />
  );
}

function Chat({
  conversationId,
  viewerId,
  counterparty,
  initialMessages,
}: {
  conversationId: string;
  viewerId: string;
  counterparty: Counterparty | null;
  initialMessages: Message[];
}) {
  const t = useTranslations("chatScreen");
  const locale = useLocale();
  const name =
    (locale === "ar" ? counterparty?.nameAr : counterparty?.nameEn) ??
    t("unknownParticipant");
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-2.5 backdrop-blur">
        <Link
          href="/messages"
          aria-label={t("back")}
          className="hover:bg-muted grid size-9 place-items-center rounded-full"
        >
          <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
        </Link>
        <div className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
        </div>
      </header>

      <MessageStream
        conversationId={conversationId}
        viewerId={viewerId}
        initialMessages={initialMessages}
      />

      <Composer conversationId={conversationId} />
    </div>
  );
}
