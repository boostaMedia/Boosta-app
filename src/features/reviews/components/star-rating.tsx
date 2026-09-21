import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only 1–5 stars. */
export function StarRating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${value} / 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            "size-4",
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
