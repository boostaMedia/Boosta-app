import Image from "next/image";

import { cn } from "@/lib/utils";

/** The Boosta Media logo lockup (arrow-B mark + wordmark). */
export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/boosta-logo.png"
      alt="Boosta Media"
      width={200}
      height={141}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );
}
