import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { BottomNav } from "@/components/app/bottom-nav";
import { Link } from "@/i18n/navigation";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Messages />;
}

const THREADS = {
  en: [
    {
      initials: "PX",
      name: "Pixel Studio",
      last: "Sure, we can start at 10 AM.",
      time: "10:24",
      unread: 2,
    },
    {
      initials: "LH",
      name: "Lens House",
      last: "The shots are ready for review.",
      time: "Yesterday",
      unread: 0,
    },
  ],
  ar: [
    {
      initials: "بك",
      name: "بيكسل ستوديو",
      last: "بالتأكيد، يمكننا البدء الساعة ١٠ صباحًا.",
      time: "10:24",
      unread: 2,
    },
    {
      initials: "لن",
      name: "لينس هاوس",
      last: "الصور جاهزة للمراجعة.",
      time: "أمس",
      unread: 0,
    },
  ],
};

function Messages() {
  const t = useTranslations("messagesScreen");
  const locale = useLocale();
  const threads = locale === "ar" ? THREADS.ar : THREADS.en;

  return (
    <div className="bg-background mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 px-4 pt-5 pb-3 backdrop-blur">
        <h1 className="font-heading text-xl font-extrabold">{t("title")}</h1>
      </header>

      <main className="flex-1 px-4 py-2">
        <ul className="space-y-2">
          {threads.map((th) => (
            <li key={th.name}>
              <Link
                href="/chat"
                className="hover:bg-muted/50 flex items-center gap-3 rounded-2xl p-3 transition-colors"
              >
                <div className="bg-brand-gradient grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                  {th.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold">{th.name}</p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {th.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground truncate text-sm">
                      {th.last}
                    </p>
                    {th.unread > 0 && (
                      <span className="bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold">
                        {th.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav active="messages" />
    </div>
  );
}
