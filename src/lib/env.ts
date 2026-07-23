import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, type-safe environment variables.
 *
 * Access variables through this object (`env.NEXT_PUBLIC_APP_URL`) rather than
 * `process.env` so that missing or malformed values fail fast at build/boot
 * time with a descriptive error, and so that types are inferred everywhere.
 *
 * Add new variables to the appropriate `server` / `client` block AND to
 * `runtimeEnv`. Client variables must be prefixed with `NEXT_PUBLIC_`.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Boosta"),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Treat empty strings as "not set" so a blank `.env` value uses the default.
  emptyStringAsUndefined: true,
  // Allow skipping validation in contexts where env is intentionally absent
  // (e.g. linting in CI). Never set this in application runtime code.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
