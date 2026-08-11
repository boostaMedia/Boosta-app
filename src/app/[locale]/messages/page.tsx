import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { requireUser } from "@/features/auth/guards";
import { getMessagesService } from "@/features/messages";
import type { ConversationSummary } from "@/features/messages";
import { Link } from "@/i18n/navigation";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "messages-screen" });

async function loadConversations(
  viewerId: string,
): Promise<ConversationSummary[]> {
  try {
    const messages = await getMessagesService();
    const { items } = await messages.listConversationSummaries(viewerId, {
      page: 1,
      pageSize: 50,
    });
    return items;
  } catch (error) {
    log.warn("conversations.load_failed", { error });
    return [];
  }
}

function formatTimestamp(iso: string, locale: string, yesterdayLabel: string) {
  const date = new Date(iso);
  const now = new Date();
  const dateKey = (d: Date) => d.toDateString();

  if (dateKey(date) === dateKey(now)) {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-KW", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateKey(date) === dateKey(yesterday)) return yesterdayLabel;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-KW", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const conversations = await loadConversations(user.id);
  const t = await getTranslations({ locale, namespace: "messagesScreen" });

  return (
    <Messages
      viewerId={user.id}
      conversations={conversations}
      yesterdayLabel={t("yesterday")}
    />
  );
}

function Messages({
  viewerId,
  conversations,
  yesterdayLabel,
}: {
  viewerId: string;
  conversations: ConversationSummary[];
  yesterdayLabel: string;
}) {
  const t = useTranslations("messagesScreen");
  const locale = useLocale();

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
      </header>

      <main className="flex-1 px-4 py-2">
        {conversations.length === 0 ? (
          <div className="border-border bg-card mt-4 rounded-2xl border border-dashed p-6 text-center">
            <p className="font-bold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => {
              const name =
                (locale === "ar"
                  ? c.counterparty?.nameAr
                  : c.counterparty?.nameEn) ?? t("unknownParticipant");
              const initials = name.slice(0, 2).toUpperCase();
              const mineLastMessage = c.lastMessage?.senderId === viewerId;
              const preview = c.lastMessage
                ? c.lastMessage.type === "text"
                  ? c.lastMessage.body
                  : c.lastMessage.type === "system"
                    ? c.lastMessage.body
                    : t("attachmentPreview")
                : t("noMessagesYet");

              return (
                <li key={c.id}>
                  <Link
                    href={`/chat/${c.id}`}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded-2xl p-3 transition-colors"
                  >
                    <div className="bg-brand-gradient grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold">{name}</p>
                        {c.lastMessage && (
                          <span className="text-muted-foreground shrink-0 text-xs">
                            {formatTimestamp(
                              c.lastMessage.createdAt,
                              locale,
                              yesterdayLabel,
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-muted-foreground truncate text-sm">
                          {mineLastMessage ? `${t("you")} ` : ""}
                          {preview}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav active="messages" />
    </div>
  );
}
