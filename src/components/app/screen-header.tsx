import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

/** Sticky detail-screen header with a locale-aware back button. */
export function ScreenHeader({
  title,
  backHref = "/home",
  action,
}: {
  title: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-3 backdrop-blur">
      <Link
        href={backHref}
        aria-label="Back"
        className="hover:bg-muted grid size-9 place-items-center rounded-full"
      >
        <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
      </Link>
      <h1 className="font-heading flex-1 truncate font-bold">{title}</h1>
      {action}
    </header>
  );
}
