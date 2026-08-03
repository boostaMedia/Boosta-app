import { ArrowLeft, Phone, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Chat />;
}

const THREAD = {
  en: {
    name: "Pixel Studio",
    initials: "PX",
    messages: [
      { me: false, text: "Hi! Yes, we can start at 10 AM." },
      { me: true, text: "Great, do you need extra equipment?" },
      { me: false, text: "No, our team brings everything 👍" },
    ],
  },
  ar: {
    name: "بيكسل ستوديو",
    initials: "بك",
    messages: [
      { me: false, text: "أهلًا! نعم يمكننا البدء الساعة ١٠ صباحًا." },
      { me: true, text: "ممتاز، هل تحتاجون معدات إضافية؟" },
      { me: false, text: "لا، فريقنا يحضر كل شيء 👍" },
    ],
  },
};

function Chat() {
  const t = useTranslations("chatScreen");
  const locale = useLocale();
  const data = locale === "ar" ? THREAD.ar : THREAD.en;

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col">
      {/* Header */}
      <header className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-2.5 backdrop-blur">
        <Link
          href="/messages"
          aria-label="Back"
          className="hover:bg-muted grid size-9 place-items-center rounded-full"
        >
          <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
        </Link>
        <div className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white">
          {data.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{data.name}</p>
          <p className="text-success text-xs font-medium">{t("online")}</p>
        </div>
        <button
          type="button"
          aria-label="Call"
          className="text-primary grid size-9 place-items-center rounded-full"
        >
          <Phone className="size-5" aria-hidden />
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 space-y-2 px-4 py-4">
        {data.messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.me ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                m.me
                  ? "bg-brand-gradient rounded-ee-md text-white"
                  : "bg-card border-border rounded-es-md border",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </main>

      {/* Composer */}
      <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 flex items-center gap-2 border-t px-3 py-2.5 backdrop-blur">
        <input
          className="border-input bg-card placeholder:text-muted-foreground h-11 w-full rounded-full border px-4 text-sm outline-none"
          placeholder={t("placeholder")}
        />
        <button
          type="button"
          aria-label="Send"
          className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-full text-white shadow-md"
        >
          <Send className="size-5 rtl:rotate-180" aria-hidden />
        </button>
      </div>
    </div>
  );
}
