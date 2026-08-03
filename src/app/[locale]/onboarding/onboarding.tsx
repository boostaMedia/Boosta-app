"use client";

import { useState } from "react";
import { CreditCard, LayoutGrid, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SLIDES = [
  { Icon: ShieldCheck, title: "s1Title", sub: "s1Sub" },
  { Icon: LayoutGrid, title: "s2Title", sub: "s2Sub" },
  { Icon: CreditCard, title: "s3Title", sub: "s3Sub" },
] as const;

export function Onboarding() {
  const t = useTranslations("onboardingScreen");
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.Icon;

  function next() {
    if (isLast) router.replace("/home");
    else setIndex((i) => i + 1);
  }

  return (
    <div className="bg-background mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-8">
      <div className="flex justify-end">
        <Link
          href="/home"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          {t("skip")}
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="bg-brand-gradient grid size-40 place-items-center rounded-[2rem] text-white shadow-md">
          <Icon className="size-16" aria-hidden />
        </div>
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-extrabold text-balance">
            {t(slide.title)}
          </h1>
          <p className="text-muted-foreground text-pretty">{t(slide.sub)}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "bg-primary w-6" : "bg-muted w-2",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="bg-brand-gradient flex h-12 w-full items-center justify-center rounded-xl font-semibold text-white shadow-md hover:opacity-90"
        >
          {isLast ? t("getStarted") : t("next")}
        </button>
      </div>
    </div>
  );
}
