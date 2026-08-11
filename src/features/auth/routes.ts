import type { UserRole } from "@/lib/constants";

/** Where to send a user immediately after a successful sign-in, by role. */
export function postLoginPath(role: UserRole): string {
  switch (role) {
    case "provider":
    case "admin":
      return "/dashboard";
    case "customer":
      return "/home";
  }
}
