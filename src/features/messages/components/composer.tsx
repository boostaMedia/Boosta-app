"use client";

import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { sendMessageAction } from "../actions";

export function Composer({ conversationId }: { conversationId: string }) {
  const t = useTranslations("chatScreen");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = value.trim();
    if (body.length === 0 || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction(conversationId, body);
      if (result.ok) {
        setValue("");
      } else {
        setError(t(`errors.${result.error}`));
      }
    });
  }

  return (
    <div className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t backdrop-blur">
      {error && (
        <p role="alert" className="text-destructive px-4 pt-2 text-xs">
          {error}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2.5"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={4000}
          dir="auto"
          className="border-input bg-card placeholder:text-muted-foreground h-11 w-full rounded-full border px-4 text-sm outline-none"
          placeholder={t("placeholder")}
        />
        <button
          type="submit"
          disabled={value.trim().length === 0 || isPending}
          aria-label={t("send")}
          className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-full text-white shadow-md disabled:opacity-50"
        >
          <Send className="size-5 rtl:rotate-180" aria-hidden />
        </button>
      </form>
    </div>
  );
}
