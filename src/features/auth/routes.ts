import type { UserRole } from "@/lib/constants";

/** Where to send a user immediately after a successful sign-in, by role. */
export function postLoginPath(role: UserRole): string {
  switch (role) {
    case "provider":
      return "/dashboard";
    case "admin":
      return "/admin";
    case "customer":
      return "/home";
  }
}
